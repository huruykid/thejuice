
-- 1. New columns
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_anonymously boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

-- 2. Allow null user_id for seed + anonymous posts
ALTER TABLE public.stories ALTER COLUMN user_id DROP NOT NULL;

-- 3. Helper: does this user have an approved non-seed post?
CREATE OR REPLACE FUNCTION public.user_has_approved_post(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stories
    WHERE user_id = _user_id
      AND status = 'approved'
      AND is_seed = false
      AND submitted_anonymously = false
  );
$$;

-- 4. Replace SELECT policy with post-to-unlock logic
DROP POLICY IF EXISTS "Approved stories viewable by verified users" ON public.stories;

CREATE POLICY "Seed posts viewable by anyone"
ON public.stories
FOR SELECT
TO anon, authenticated
USING (is_seed = true AND status = 'approved');

CREATE POLICY "Approved community posts viewable by unlocked users"
ON public.stories
FOR SELECT
TO authenticated
USING (
  status = 'approved'
  AND is_seed = false
  AND is_user_verified(auth.uid())
  AND public.user_has_approved_post(auth.uid())
);

CREATE POLICY "Users see their own stories"
ON public.stories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins see all stories"
ON public.stories
FOR SELECT
TO authenticated
USING (current_user_has_role('admin'::app_role));

-- 5. Allow anonymous visitors to submit a pending anonymous post
DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.stories;

CREATE POLICY "Authenticated users can create stories"
ON public.stories
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND NOT is_user_suspended(auth.uid())
  AND submitted_anonymously = false
  AND is_seed = false
);

CREATE POLICY "Anonymous visitors can submit pending posts"
ON public.stories
FOR INSERT
TO anon
WITH CHECK (
  submitted_anonymously = true
  AND user_id IS NULL
  AND status = 'pending'
  AND is_seed = false
);

-- 6. Grants — anon needs SELECT for seed feed + INSERT for anon submissions
GRANT SELECT, INSERT ON public.stories TO anon;

-- 7. Index to make user_has_approved_post fast
CREATE INDEX IF NOT EXISTS idx_stories_user_approved_nonseed
  ON public.stories (user_id)
  WHERE status = 'approved' AND is_seed = false AND submitted_anonymously = false;

CREATE INDEX IF NOT EXISTS idx_stories_seed_approved
  ON public.stories (created_at DESC)
  WHERE is_seed = true AND status = 'approved';
