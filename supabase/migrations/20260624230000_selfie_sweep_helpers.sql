-- Applied to prod 2026-06-24 via connector. Supports the `selfie-sweep` edge function.

-- HTTP extension so the DB can trigger the sweep edge function.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Returns the exact storage object paths to delete: every verification-selfie file
-- whose owner (first path segment = user_id) is NOT a still-pending verification.
CREATE OR REPLACE FUNCTION public.processed_selfie_object_names()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'verification-selfies'
    AND split_part(o.name, '/', 1) NOT IN (
      SELECT user_id::text FROM public.user_verifications WHERE verification_status = 'pending'
    );
$$;

REVOKE ALL ON FUNCTION public.processed_selfie_object_names() FROM PUBLIC, anon, authenticated;
