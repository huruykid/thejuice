-- 1) User blocks table for safety
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Policies for user_blocks
CREATE POLICY IF NOT EXISTS "Users can create their own blocks"
ON public.user_blocks
FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY IF NOT EXISTS "Users can view their own blocks"
ON public.user_blocks
FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY IF NOT EXISTS "Admins can view all blocks"
ON public.user_blocks
FOR SELECT
USING (current_user_has_role('admin'::app_role));

CREATE POLICY IF NOT EXISTS "Users can delete their own blocks"
ON public.user_blocks
FOR DELETE
USING (auth.uid() = blocker_id);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- Helper function to check block relationship
CREATE OR REPLACE FUNCTION public.is_blocked(_actor uuid, _target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE blocker_id = _actor AND blocked_id = _target
  );
$$;

-- Helper to get story owner (by user_id)
CREATE OR REPLACE FUNCTION public.get_story_owner(_story_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.stories WHERE id = _story_id LIMIT 1;
$$;

-- 2) User suspensions for admin enforcement
CREATE TABLE IF NOT EXISTS public.user_suspensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid
);

ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage and view suspensions
CREATE POLICY IF NOT EXISTS "Admins manage suspensions"
ON public.user_suspensions
AS PERMISSIVE
FOR ALL
USING (current_user_has_role('admin'::app_role))
WITH CHECK (current_user_has_role('admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON public.user_suspensions(user_id);

-- Helper: is user suspended now?
CREATE OR REPLACE FUNCTION public.is_user_suspended(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_suspensions s
    WHERE s.user_id = _user
      AND (s.revoked_at IS NULL)
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$$;

-- 3) Reports table for UGC reporting
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('story','comment','user')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending', -- pending | reviewing | action_taken | dismissed
  reviewed_by uuid,
  reviewed_at timestamptz,
  action_taken text
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reports_set_updated_at ON public.reports;
CREATE TRIGGER trg_reports_set_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies for reports
CREATE POLICY IF NOT EXISTS "Users can file reports"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY IF NOT EXISTS "Reporters can view their own reports"
ON public.reports
FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY IF NOT EXISTS "Admins can view and update reports"
ON public.reports
FOR SELECT
USING (current_user_has_role('admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins can update reports"
ON public.reports
FOR UPDATE
USING (current_user_has_role('admin'::app_role))
WITH CHECK (current_user_has_role('admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- 4) Add story moderation flag and admin control
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false;

-- Allow admins to update or delete any story for moderation actions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stories' AND policyname = 'Admins can update any story' 
  ) THEN
    CREATE POLICY "Admins can update any story" ON public.stories FOR UPDATE USING (current_user_has_role('admin'::app_role)) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stories' AND policyname = 'Admins can delete any story' 
  ) THEN
    CREATE POLICY "Admins can delete any story" ON public.stories FOR DELETE USING (current_user_has_role('admin'::app_role));
  END IF;
END $$;

-- 5) Tighten interaction policies to respect blocks and suspensions
-- Recreate reactions INSERT policy with block/suspension checks
DROP POLICY IF EXISTS "Verified users can create reactions" ON public.reactions;
CREATE POLICY "Verified users can create reactions"
ON public.reactions
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  AND is_user_verified(auth.uid())
  AND NOT public.is_user_suspended(auth.uid())
  AND NOT public.is_blocked(auth.uid(), public.get_story_owner(story_id))
  AND NOT public.is_blocked(public.get_story_owner(story_id), auth.uid())
);

-- Recreate comments INSERT policy with block/suspension checks
DROP POLICY IF EXISTS "Verified users can create comments" ON public.comments;
CREATE POLICY "Verified users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  AND is_user_verified(auth.uid())
  AND NOT public.is_user_suspended(auth.uid())
  AND NOT public.is_blocked(auth.uid(), public.get_story_owner(story_id))
  AND NOT public.is_blocked(public.get_story_owner(story_id), auth.uid())
);

-- Update stories INSERT policy to respect suspensions
DROP POLICY IF EXISTS "Verified users can create stories" ON public.stories;
CREATE POLICY "Verified users can create stories"
ON public.stories
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  AND is_user_verified(auth.uid())
  AND NOT public.is_user_suspended(auth.uid())
);
