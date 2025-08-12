-- Tighten stories read access to authenticated users only
-- 1) Remove public SELECT policy
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;

-- 2) Allow only authenticated users to read stories
CREATE POLICY "Stories are viewable by authenticated users"
ON public.stories
FOR SELECT
TO authenticated
USING (true);

-- Note: Other existing INSERT/UPDATE/DELETE policies remain unchanged.
-- This prevents unauthenticated/public access while preserving current app behavior for signed-in users.