-- Growth: remove the "post-to-unlock" gate. Applied to prod 2026-06-25 via connector.
-- Verified users can now read approved community posts without having posted their own
-- first. Seed posts remain viewable by any authenticated user via their existing policy.
DROP POLICY IF EXISTS "Approved community posts viewable by unlocked users" ON public.stories;

CREATE POLICY "Approved community posts viewable by verified users"
ON public.stories
FOR SELECT
TO authenticated
USING (
  status = 'approved'
  AND is_seed = false
  AND is_user_verified(auth.uid())
);
