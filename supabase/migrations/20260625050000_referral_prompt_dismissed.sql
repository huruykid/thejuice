-- Make the "how did you hear about us?" prompt truly show once. Applied to prod 2026-06-25.
-- A dedicated dismissed flag (separate from referral_source) means it never re-displays
-- after being shown, skipped, or ignored — while keeping referral_source clean for real
-- attribution. The frontend (ReferralPrompt) sets this flag the first time the prompt shows.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_prompt_dismissed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.referral_prompt_dismissed IS
  'True once the referral prompt has been shown/answered/skipped, so it never re-displays. Kept separate from referral_source so attribution data stays clean.';
