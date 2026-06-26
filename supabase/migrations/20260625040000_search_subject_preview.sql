-- Phase 0 foundation: grouped, content-free "person preview" for the search-led home.
-- Applied to prod 2026-06-25. One row per subject name matching the query, with review
-- count + average vibe + whether it's seed (fictional). Review text is returned ONLY for
-- seed content; real reviews come back content-free (locked) so unverified users see that
-- tea EXISTS without reading it. Any signed-in user can call it; reading full real content
-- stays gated by the existing RLS.
CREATE OR REPLACE FUNCTION public.search_subject_preview(q text)
RETURNS TABLE (
  subject_name text,
  review_count bigint,
  avg_vibe numeric,
  is_seed boolean,
  preview text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.subject_name,
    count(*) AS review_count,
    round(avg(s.overall_vibe_rating)::numeric, 1) AS avg_vibe,
    bool_or(s.is_seed) AS is_seed,
    CASE WHEN bool_or(s.is_seed) THEN left(min(s.content), 90) ELSE NULL END AS preview
  FROM public.stories s
  WHERE s.status = 'approved'
    AND s.subject_name IS NOT NULL
    AND btrim(s.subject_name) <> ''
    AND s.subject_name ILIKE '%' || q || '%'
  GROUP BY s.subject_name
  ORDER BY review_count DESC, max(s.created_at) DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.search_subject_preview(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_subject_preview(text) TO authenticated;
