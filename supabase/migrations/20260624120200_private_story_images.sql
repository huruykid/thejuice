-- P0-3: Make the `story-images` bucket private so photos of named, non-consenting
-- story subjects are no longer world-readable by URL.
--
-- ⚠️ DEPLOY ORDERING: apply this in lockstep with the frontend that resolves images
-- to signed URLs (src/hooks/useStoryImageUrls.ts, used by StoryCard; uploads now store
-- object paths via src/components/CreateStory/index.tsx). If applied BEFORE that
-- frontend is live, existing public <img> URLs will 404. Deploy frontend first, then
-- apply this. The signed-URL resolver is backward-compatible with rows that stored
-- legacy public URLs, so no data backfill is required.

UPDATE storage.buckets SET public = false WHERE id = 'story-images';

DROP POLICY IF EXISTS "Anyone can view story images" ON storage.objects;

CREATE POLICY "Verified users and admins can view story images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'story-images'
  AND (
    is_user_verified(auth.uid())
    OR current_user_has_role('admin'::app_role)
  )
);
