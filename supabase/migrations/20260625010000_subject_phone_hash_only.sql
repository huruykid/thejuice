-- Phone privacy: never persist the raw subject phone number. Applied to prod 2026-06-25.
-- Store only a peppered one-way hash; search matches on the hash via a server-side
-- function. Keeps phone-search while removing the raw number from storage and from every
-- client payload (the column is force-nulled at write time by a trigger).
-- The pepper is generated in-DB (not in this file) and stored in a client-unreadable table.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;  -- no policies => API roles can't read
REVOKE ALL ON public.app_secrets FROM anon, authenticated;
INSERT INTO public.app_secrets(name, value)
  VALUES ('phone_pepper', encode(extensions.gen_random_bytes(32), 'hex'))
  ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS subject_phone_hash text;
CREATE INDEX IF NOT EXISTS idx_stories_subject_phone_hash
  ON public.stories (subject_phone_hash) WHERE subject_phone_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.hash_subject_phone(p text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT CASE
    WHEN p IS NULL OR btrim(p) = '' THEN NULL
    ELSE encode(
      extensions.hmac(
        public.normalize_phone_number(p),
        (SELECT value FROM public.app_secrets WHERE name = 'phone_pepper'),
        'sha256'
      ), 'hex')
  END;
$$;
REVOKE ALL ON FUNCTION public.hash_subject_phone(text) FROM PUBLIC, anon, authenticated;

UPDATE public.stories
SET subject_phone_hash = public.hash_subject_phone(subject_phone),
    subject_phone = NULL
WHERE subject_phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.stories_hash_subject_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subject_phone IS NOT NULL AND btrim(NEW.subject_phone) <> '' THEN
    NEW.subject_phone_hash := public.hash_subject_phone(NEW.subject_phone);
  END IF;
  NEW.subject_phone := NULL;  -- raw number is never stored
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.stories_hash_subject_phone() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_stories_hash_subject_phone ON public.stories;
CREATE TRIGGER trg_stories_hash_subject_phone
  BEFORE INSERT OR UPDATE OF subject_phone ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stories_hash_subject_phone();

CREATE OR REPLACE FUNCTION public.search_stories_by_phone(p text)
RETURNS SETOF public.stories
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.*
  FROM public.stories s
  WHERE s.status = 'approved'
    AND s.subject_phone_hash IS NOT NULL
    AND s.subject_phone_hash = public.hash_subject_phone(p)
    AND public.is_user_verified(auth.uid())
  LIMIT 10;
$$;
REVOKE ALL ON FUNCTION public.search_stories_by_phone(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_stories_by_phone(text) TO authenticated;
