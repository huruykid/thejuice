-- CATCH-UP FILE: applied to prod but missing from repo. Recreated 2026-06-24 to
-- reconcile history. Already applied in prod — mark applied, do not re-run.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_source text;

COMMENT ON COLUMN profiles.referral_source IS 'How the user heard about the app — captured once on UnverifiedHome';
