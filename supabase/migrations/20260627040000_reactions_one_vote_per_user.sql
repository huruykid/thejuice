-- Enforce one reaction row per user per story at the database level, closing the
-- client-side TOCTOU race that could let a fast double-tap create two reaction rows
-- (which the count trigger would then count twice). No existing duplicates — verified.
ALTER TABLE public.reactions
  ADD CONSTRAINT reactions_story_user_unique UNIQUE (story_id, user_id);
