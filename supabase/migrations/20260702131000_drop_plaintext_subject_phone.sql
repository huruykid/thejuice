-- Security: the raw subject_phone column is force-nulled on every write (only
-- the peppered hash is kept), so it never contains data — but it remains
-- selectable by verified users under the stories RLS row policy, which scanners
-- (correctly) flag as a raw-PII exposure surface. Remove the column entirely and
-- move hashing to an owner-scoped RPC, so there is no raw phone column at all.

-- Owner-scoped setter: hashes the phone server-side (pepper stays server-only)
-- and writes ONLY the hash, for a story the caller owns.
CREATE OR REPLACE FUNCTION public.set_story_subject_phone_hash(p_story_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_phone IS NULL OR btrim(p_phone) = '' THEN
    RETURN;
  END IF;
  UPDATE public.stories
     SET subject_phone_hash = public.hash_subject_phone(p_phone)
   WHERE id = p_story_id
     AND user_id = auth.uid();
END;
$function$;
REVOKE ALL ON FUNCTION public.set_story_subject_phone_hash(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_story_subject_phone_hash(uuid, text) TO authenticated;

-- Drop everything tied to the raw column, then the column itself.
DROP TRIGGER IF EXISTS trg_stories_hash_subject_phone ON public.stories;
DROP TRIGGER IF EXISTS normalize_story_subject_phone_trigger ON public.stories;
DROP TRIGGER IF EXISTS validate_subject_phone_before_insert_update ON public.stories;

DROP FUNCTION IF EXISTS public.stories_hash_subject_phone();
DROP FUNCTION IF EXISTS public.normalize_story_subject_phone();
DROP FUNCTION IF EXISTS public.validate_story_subject_phone();

ALTER TABLE public.stories DROP COLUMN IF EXISTS subject_phone;
