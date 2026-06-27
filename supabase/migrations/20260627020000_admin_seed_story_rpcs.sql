-- Admin seeding tool (applied to prod 2026-06-27): create/delete curated "seed" stories
-- (is_seed=true, approved, no author → renders like the existing seed content). Self-gated to
-- admins. Lets the founder populate the feed fast while real supply ramps. Keep seed content
-- anonymized (no real named people).
CREATE OR REPLACE FUNCTION public.admin_create_seed_story(
  p_content text,
  p_subject_name text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_communication int DEFAULT 3,
  p_loyalty int DEFAULT 3,
  p_vibe int DEFAULT 3,
  p_emotional_safety int DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_content IS NULL OR btrim(p_content) = '' THEN
    RAISE EXCEPTION 'content required';
  END IF;
  INSERT INTO public.stories (
    content, subject_name, location, is_seed, status, submitted_anonymously,
    communication_rating, loyalty_rating, overall_vibe_rating, emotional_safety_rating, approved_at
  ) VALUES (
    btrim(p_content),
    nullif(btrim(coalesce(p_subject_name, '')), ''),
    nullif(btrim(coalesce(p_location, '')), ''),
    true, 'approved', false,
    greatest(1, least(5, p_communication)),
    greatest(1, least(5, p_loyalty)),
    greatest(1, least(5, p_vibe)),
    greatest(1, least(5, p_emotional_safety)),
    now()
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_seed_story(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.stories WHERE id = p_id AND is_seed = true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_seed_story(text, text, text, int, int, int, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_seed_story(text, text, text, int, int, int, int) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_delete_seed_story(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_seed_story(uuid) TO authenticated;
