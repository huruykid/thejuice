-- Security hardening (applied to prod 2026-06-26). Trigger functions fire as the table owner
-- via the trigger mechanism and are never meant to be called directly via PostgREST RPC.
-- Revoke client EXECUTE on all SECURITY DEFINER trigger functions in public (addresses the
-- advisor's "public/signed-in can execute SECURITY DEFINER function" warnings for the
-- trigger-only subset). Zero behavioral change: triggers still fire normally. Non-trigger
-- helpers (has_role, is_user_verified, etc.) are intentionally left granted because the app
-- and RLS policies depend on them.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS fn
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype = 'pg_catalog.trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', r.fn);
  END LOOP;
END $$;
