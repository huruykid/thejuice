-- Service-role-only accessor for internal gate secrets stored in Vault. Applied 2026-06-26.
-- Edge functions call this (with the service-role key) to fetch the expected header secret
-- at runtime, so no internal secret is ever hardcoded in code or migrations again.
-- (Secret VALUES live only in Vault — set out-of-band, never committed.)
CREATE OR REPLACE FUNCTION public.internal_secret(p_name text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = p_name;
$$;

REVOKE ALL ON FUNCTION public.internal_secret(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.internal_secret(text) TO service_role;
