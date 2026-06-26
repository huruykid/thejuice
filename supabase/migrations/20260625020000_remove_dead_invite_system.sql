-- Remove the unused, insecure invite system (both "invite" Critical scanner findings).
-- Applied to prod 2026-06-25. It was not wired into the live app (invite UI is dead code;
-- useInvites had no consumers) and the repo already intended to drop it. This eliminates
-- the hardcoded master-code path, the unlimited-code-generation hole, and repo/prod drift.
-- The auth.users invite-stats trigger is dropped first so removing the table can't break
-- signup; the profile + role-assignment triggers are intentionally left intact.

DROP TRIGGER IF EXISTS on_auth_user_created_invite_stats ON auth.users;
DROP TRIGGER IF EXISTS tr_handle_new_user_invite_stats ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_invite_stats() CASCADE;

DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.generate_user_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.use_invite_code(text, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_invite_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.check_invite_generation_rate_limit(uuid) CASCADE;

DROP TABLE IF EXISTS public.invite_codes CASCADE;
DROP TABLE IF EXISTS public.user_invite_stats CASCADE;
