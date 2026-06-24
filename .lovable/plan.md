## What's actually going on

Photo upload and display already work end-to-end:
- `PersonDetailsStep` requires ≥1 image (Next button disabled otherwise).
- `CreateStory` uploads files to the `story-images` bucket and stores the URLs as a JSON array in `stories.image_url`.
- `StoryCard` parses that JSON and renders an IG-style full-bleed carousel.
- DB constraint `stories_require_image` (NOT VALID) blocks new non-seed rows with NULL image.

The "box of text" the user is seeing is the 3 legacy approved, non-seed stories that were posted before photos were required (and the seeded persona posts, which also have no image). Fix is two-fold: hide imageless community posts from the feed, and tighten a couple of gaps.

## Changes

### 1. Feed queries: hide imageless community stories
Update `src/hooks/useStories.ts`, `src/hooks/useStoriesByCity.ts`, `src/hooks/useSearchStories.ts`, `src/hooks/useTrendingStories.ts`, `src/hooks/useNearbyStories.ts` to add `.not('image_url', 'is', null)` for community feed queries (mode !== 'seed' or unfiltered).

Effect: the 3 legacy photoless posts drop off the public feed immediately, so users only see IG-style cards. They remain visible to their authors via `useMySubmissions` so the repost-email flow still works.

### 2. Tighten validation in `useCreateStory`
Right now the hook accepts `imageUrl` as optional. Add an explicit guard at the top of the mutation that throws `"At least one photo is required"` if `imageUrl` is missing/empty, so the client surfaces a clean error if anyone bypasses the UI gate. Keeps DB constraint as the last line of defense.

### 3. Validate the existing constraint
The DB constraint is `NOT VALID` — it only enforces on new rows. Run `ALTER TABLE public.stories VALIDATE CONSTRAINT stories_require_image;` after first deleting/repairing the 3 legacy photoless rows. Two options for those 3 rows:
- (a) leave them, skip VALIDATE (current state)
- (b) soft-hide by flipping their `status` to `pending` so authors re-submit with a photo via the repost email
- (c) hard delete

Recommend (b): flip status to `pending` with a `rejection_reason = 'Photo now required — please re-upload'`, then VALIDATE the constraint. The repost email we set up already nudges those users.

### 4. Quick sanity check on the storage bucket
Confirm `story-images` is public and has an INSERT policy for `authenticated`. If not, photo uploads silently fail and we end up right back at photoless rows. Add a policy via migration if missing.

## Out of scope
- No StoryCard UI changes — the IG layout is already correct.
- No new image processing / cropping / filters.

## Open question
Which option for the 3 legacy photoless approved stories: (a) leave, (b) flip to pending so authors re-upload, or (c) delete?