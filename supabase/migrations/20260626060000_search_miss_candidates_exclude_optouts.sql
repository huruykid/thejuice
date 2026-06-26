-- Add opt-out exclusion to the nudge candidate query. Applied to prod 2026-06-26.
-- Anyone who unsubscribed from marketing email must not receive the (promotional)
-- search-miss nudge either.
CREATE OR REPLACE FUNCTION public.get_search_miss_candidates(max_rows int DEFAULT 200)
RETURNS TABLE (user_id uuid, subject_name text, last_miss timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH misses AS (
    SELECT e.user_id,
           lower(btrim(e.props->>'name')) AS norm_name,
           (array_agg(e.props->>'name' ORDER BY e.created_at DESC))[1] AS subject_name,
           max(e.created_at) AS last_miss
    FROM public.analytics_events e
    WHERE e.event = 'search_miss'
      AND e.props->>'name' IS NOT NULL
      AND btrim(e.props->>'name') <> ''
      AND e.created_at > now() - interval '7 days'
      AND e.created_at < now() - interval '20 hours'
    GROUP BY e.user_id, lower(btrim(e.props->>'name'))
  )
  SELECT DISTINCT ON (m.user_id) m.user_id, m.subject_name, m.last_miss
  FROM misses m
  WHERE NOT EXISTS (
    SELECT 1 FROM public.analytics_events p
    WHERE p.user_id = m.user_id AND p.event = 'post_created'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.analytics_events s
    WHERE s.user_id = m.user_id
      AND s.event = 'search_miss_emailed'
      AND lower(btrim(s.props->>'name')) = m.norm_name
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.email_optouts eo
    WHERE eo.user_id = m.user_id
  )
  ORDER BY m.user_id, m.last_miss DESC
  LIMIT max_rows;
$$;
