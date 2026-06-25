-- CATCH-UP FILE: this migration was applied to prod (theJuice) but was never in the
-- repo. Recreated from prod's supabase_migrations.schema_migrations on 2026-06-24 to
-- reconcile history. Already applied in prod — mark applied, do not re-run.

-- 1. Remove the hardcoded test-admin backdoor.
--    (Auto-granted 'admin' to anyone signing up as testing2424@gmail.com.)
DROP FUNCTION IF EXISTS public.assign_test_admin_role() CASCADE;

-- 2. Tighten the profiles INSERT policy.
--    Was WITH CHECK (true) -> any caller could insert arbitrary profile rows.
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Storage: remove world-writable / world-listable policies on the
--    public 'story-images' bucket. Per-owner policies remain in place.
DROP POLICY IF EXISTS "Anyone can view story images"   ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload story images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update story images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete story images" ON storage.objects;

-- 4. Remove the stale/ineffective admin policy for verification selfies.
DROP POLICY IF EXISTS "Admins can view verification selfies" ON storage.objects;

-- 5. Revoke EXECUTE on internal trigger functions from the API roles.
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
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated', r.sig);
  END LOOP;
END $$;
