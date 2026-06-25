-- CATCH-UP FILE: applied to prod but missing from repo. Recreated 2026-06-24 to
-- reconcile history. Already applied in prod — mark applied, do not re-run.
--
-- New posting model: any signed-in user can submit a story; verified authors'
-- posts auto-publish, unverified authors' posts wait for admin approval; only
-- verified users read approved stories (authors see their own; admins see all).

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected'));
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS approved_by uuid;

CREATE OR REPLACE FUNCTION public.set_story_initial_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_user_verified(NEW.user_id) THEN
    NEW.status := 'approved';
    NEW.approved_at := now();
  ELSE
    NEW.status := 'pending';
    NEW.approved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_story_initial_status ON public.stories;
CREATE TRIGGER trg_set_story_initial_status
  BEFORE INSERT ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_initial_status();

REVOKE EXECUTE ON FUNCTION public.set_story_initial_status() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Verified users can create stories" ON public.stories;
CREATE POLICY "Authenticated users can create stories"
  ON public.stories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_user_suspended(auth.uid()));

DROP POLICY IF EXISTS "Stories are viewable by authenticated users" ON public.stories;
CREATE POLICY "Approved stories viewable by verified users"
  ON public.stories
  FOR SELECT
  TO authenticated
  USING (
    (status = 'approved' AND public.is_user_verified(auth.uid()))
    OR auth.uid() = user_id
    OR public.current_user_has_role('admin'::public.app_role)
  );
