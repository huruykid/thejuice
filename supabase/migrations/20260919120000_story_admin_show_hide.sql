-- Admin show/hide for stories. Applied to prod 2026-09-19.
--
-- "Hide" takes an approved story off every community surface without deleting it
-- or touching its moderation status, and "show" reverses it. Enforced RLS-first:
-- hidden rows drop out of the community read clauses but stay visible to their
-- author (so "Your submissions" stays honest) and to admins. The two SECURITY
-- DEFINER search RPCs bypass RLS, so they filter explicitly. Non-admins can't flip
-- the flag on their own row — the same trigger that already guards `status`.

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid;

-- ── Read gate: community clauses exclude hidden; own-rows and admin do not ─────
DROP POLICY IF EXISTS "Stories readable: own, seed, approved-for-verified, or admin" ON public.stories;
CREATE POLICY "Stories readable: own, seed, approved-for-verified, or admin" ON public.stories
  FOR SELECT TO authenticated USING (
    ((SELECT auth.uid()) = user_id)
    OR (is_seed = true AND status = 'approved'::text AND is_hidden = false)
    OR (
      status = 'approved'::text
      AND is_seed = false
      AND is_hidden = false
      AND (SELECT is_user_verified((SELECT auth.uid())))
    )
    OR (SELECT current_user_has_role('admin'::app_role))
  );

-- Tags follow story visibility, so a hidden story's tags don't leak either.
DROP POLICY IF EXISTS "Story tags follow story visibility" ON public.story_tags;
CREATE POLICY "Story tags follow story visibility" ON public.story_tags
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_tags.story_id
        AND (
          (s.status = 'approved' AND s.is_hidden = false)
          OR s.user_id = auth.uid()
          OR public.current_user_has_role('admin'::public.app_role)
        )
    )
  );

-- ── Tamper-proofing: only admins may hide/unhide; stamp an audit trail ─────────
CREATE OR REPLACE FUNCTION public.protect_story_moderation_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.current_user_has_role('admin'::public.app_role) THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'approved' THEN
        NEW.approved_at := now();
        NEW.approved_by := auth.uid();
      ELSE
        NEW.approved_at := NULL;
        NEW.approved_by := NULL;
      END IF;
    END IF;
    -- Show/hide audit trail: stamp on hide, clear on show.
    IF NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN
      IF NEW.is_hidden THEN
        NEW.hidden_at := now();
        NEW.hidden_by := auth.uid();
      ELSE
        NEW.hidden_at := NULL;
        NEW.hidden_by := NULL;
      END IF;
    END IF;
  ELSE
    NEW.status := OLD.status;
    NEW.approved_at := OLD.approved_at;
    NEW.approved_by := OLD.approved_by;
    -- Only admins can hide or unhide.
    NEW.is_hidden := OLD.is_hidden;
    NEW.hidden_at := OLD.hidden_at;
    NEW.hidden_by := OLD.hidden_by;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.protect_story_moderation_fields() FROM PUBLIC, anon, authenticated;

-- ── SECURITY DEFINER search RPCs bypass RLS — filter hidden explicitly ─────────
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
    AND s.is_hidden = false
    AND s.subject_name IS NOT NULL
    AND btrim(s.subject_name) <> ''
    AND s.subject_name ILIKE '%' || q || '%'
  GROUP BY s.subject_name
  ORDER BY review_count DESC, max(s.created_at) DESC
  LIMIT 20;
$$;
REVOKE ALL ON FUNCTION public.search_subject_preview(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_subject_preview(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_stories_by_phone(p text)
RETURNS SETOF public.stories
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.stories s
  WHERE s.status = 'approved'
    AND s.is_hidden = false
    AND s.subject_phone_hash IS NOT NULL
    AND s.subject_phone_hash = public.hash_subject_phone(p)
    AND public.is_user_verified(auth.uid())
  LIMIT 10;
$$;
REVOKE ALL ON FUNCTION public.search_stories_by_phone(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_stories_by_phone(text) TO authenticated;
