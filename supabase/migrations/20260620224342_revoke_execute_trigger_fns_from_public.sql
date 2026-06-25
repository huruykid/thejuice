-- CATCH-UP FILE: applied to prod but missing from repo. Recreated 2026-06-24 to
-- reconcile history. Already applied in prod — mark applied, do not re-run.

-- Trigger functions are invoked by the trigger mechanism, not by callers, so revoking
-- EXECUTE from PUBLIC (and the API roles) is safe and stops them being callable as RPCs.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prorettype = 'pg_catalog.trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;
