-- ROOT-CAUSE FIX (PM queue #2): stop new public tables auto-granting write verbs to anon.
-- Applied to prod 2026-06-24 via connector.
--
-- Supabase's stock default-privilege rule grants anon = arwdDxtm (ALL) on every new
-- table created by `postgres` (the role migrations run as). That is why push_tokens /
-- dispute_requests re-inherited anon DELETE/UPDATE/TRUNCATE and needed manual revokes.
-- This sets a least-privilege DEFAULT so future migration-created tables are clean.
-- anon keeps SELECT/INSERT defaults (RLS-gated, Supabase-conventional); authenticated
-- is unchanged (owner edits rely on it).

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon;

-- RESIDUAL: the equivalent change for the `supabase_admin` granting role (which applies
-- to tables created via the dashboard Table Editor) could NOT be applied here —
-- "permission denied to change default privileges". If tables are ever created through
-- the dashboard, either run the following from the dashboard SQL editor as a role with
-- supabase_admin membership, or revoke anon write grants on that table manually:
--   ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--     REVOKE UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon;
