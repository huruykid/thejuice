-- CATCH-UP FILE: applied to prod but missing from repo. Recreated 2026-06-24 to
-- reconcile history. Already applied in prod — mark applied, do not re-run.

-- Backfill profile_id on comments where it's null, using user_id -> profiles.user_id
UPDATE comments c
SET profile_id = p.id
FROM profiles p
WHERE c.user_id = p.user_id
  AND c.profile_id IS NULL;
