-- Search performance: trigram indexes for the ilike '%term%' matchers used by
-- Explore search (useUnifiedSearch) and the Home name lookup (useSubjectLookup).
-- Plain btree indexes can't serve infix ilike; pg_trgm GIN indexes can.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE INDEX IF NOT EXISTS idx_stories_subject_name_trgm
  ON public.stories USING gin (subject_name extensions.gin_trgm_ops)
  WHERE subject_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_content_trgm
  ON public.stories USING gin (content extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_stories_normalized_location_trgm
  ON public.stories USING gin (normalized_location extensions.gin_trgm_ops)
  WHERE normalized_location IS NOT NULL;
