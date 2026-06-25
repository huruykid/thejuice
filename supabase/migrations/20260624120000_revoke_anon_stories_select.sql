-- P0-2: Stop exposing the stories table to the anonymous role.
--
-- Background: migration 20260622233016 added `GRANT SELECT, INSERT ON public.stories
-- TO anon` plus a "Seed posts viewable by anyone" policy granted to `anon`. Because
-- the grant is table-wide (all columns), any unauthenticated client holding the public
-- anon key could read seed rows directly via the REST API, including `subject_name`,
-- `image_url`, `user_id`, and `profile_id` of the named people stories are about.
-- (`subject_phone` was already dropped in 20250822175548.)
--
-- Every story-reading route in the client is auth/verified-gated:
--   * /story/:id        -> VerifiedRoute
--   * /author/:id, /app, /explore, /profile, /activity -> ProtectedRoute / auth gate
--   * The only public, no-auth story interaction is the anonymous submission form
--     at /share (SharePublic), which performs an INSERT only (no `.select()`, so it
--     uses return=minimal and does NOT require SELECT).
--
-- Therefore anon never needs SELECT on stories. We revoke it and scope the seed-feed
-- SELECT policy to authenticated users only. anon retains INSERT for the public
-- anonymous-submission form.

-- 1. Remove the table-wide SELECT privilege from anon (keep INSERT).
REVOKE SELECT ON public.stories FROM anon;

-- 2. Make the seed-feed read policy explicit: only authenticated users read seed posts.
--    (Authenticated-but-unverified users still see the seed feed; this is unchanged.)
DROP POLICY IF EXISTS "Seed posts viewable by anyone" ON public.stories;

CREATE POLICY "Seed posts viewable by authenticated users"
ON public.stories
FOR SELECT
TO authenticated
USING (is_seed = true AND status = 'approved');

-- Note: the anon INSERT policy "Anonymous visitors can submit pending posts" and the
-- INSERT grant are intentionally left in place so the public /share form keeps working.
