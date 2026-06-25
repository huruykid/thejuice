-- P0-2b: Remove dangerous write privileges from the anon role across all public
-- tables. The anon (unauthenticated) role had inherited DELETE/UPDATE/TRUNCATE/
-- TRIGGER/REFERENCES on every public table from a broad historical GRANT. RLS
-- currently blocks their use (all UPDATE/DELETE/ALL policies require auth.uid()/admin,
-- which anon lacks) and TRUNCATE is not exposed via PostgREST, so this was not
-- exploitable via the public anon key — but it violates least privilege, and one
-- future RLS misstep would make it catastrophic. anon never needs to mutate rows.
-- SELECT/INSERT grants (RLS-gated, legitimately used) are intentionally untouched;
-- the `authenticated` role is NOT modified (owner edits/deletes rely on it).

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE DELETE, UPDATE, TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon',
      r.tablename
    );
  END LOOP;
END $$;
