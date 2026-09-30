-- =============================================================================
-- Lock down SECURITY DEFINER function EXECUTE grants + RLS initplan fix
-- =============================================================================
-- NOT YET APPLIED TO PRODUCTION. Dry-run inside `begin; ... rollback;` first,
-- then apply via Supabase MCP `apply_migration` with this identical SQL.
--
-- Context: the Supabase security advisor (2026-09-30) flags 9 SECURITY DEFINER
-- functions executable by `anon` and 26 executable by `authenticated`.
-- Evidence gathered read-only against prod on 2026-09-30:
--   * pg_policies (public + storage schemas) for policy references and the
--     role each policy applies to. A policy with role `public` also runs as
--     `anon`, and anon holds table-level INSERT on comments/reactions and
--     SELECT on account_deletion_feedback, so those policies DO execute as anon.
--   * pg_views / pg_rewrite dependencies: no view references any of these.
--   * `grep -rn "\.rpc(" src` for live client callers (and whether the calling
--     hook is actually imported anywhere).
--   * supabase/functions/*: every edge-function rpc() uses the service-role key.
--
-- Postgres gotcha (see CLAUDE.md): functions default to EXECUTE for PUBLIC, so
-- every revoke below revokes from PUBLIC as well and re-grants the roles that
-- still need it, always including service_role.
--
-- Per-function decisions
-- ----------------------------------------------------------------------------
-- function                     anon     authenticated  reason
-- ----------------------------------------------------------------------------
-- check_rate_limit             KEEP     KEEP   WITH CHECK of dispute_requests
--                                              "Anyone can submit dispute" (role
--                                              public: logged-out subjects file
--                                              disputes); also called pre-login in
--                                              useAuth.signIn. Body ignores the
--                                              caller's limits/identifier and keys
--                                              on auth.uid() or client IP.
-- current_user_has_role        KEEP     KEEP   ~40 public/storage policies, several
--                                              role `public` (blog read, selfie
--                                              read). Only answers about the caller.
-- detect_suspicious_activity   KEEP*    KEEP*  Called as anon from useAuth.signIn on
--                                              failed login. *FLAGGED: body uses
--                                              COALESCE(auth.uid(), p_user_id), so
--                                              anon can attribute audit rows to any
--                                              user id. Fix the body, not the grant.
-- get_story_owner              KEEP     KEEP   comments/reactions INSERT policies
--                                              (role public). FLAGGED: maps any
--                                              story id to its author's user id.
-- has_role                     KEEP     KEEP   account_deletion_feedback SELECT
--                                              policy (role public), analytics_events
--                                              + growth_experiments (authenticated).
--                                              FLAGGED: lets anyone probe whether an
--                                              arbitrary uuid is admin.
-- is_blocked                   KEEP     KEEP   comments/reactions INSERT policies
--                                              (role public).
-- is_seed_story                REVOKE   KEEP   Only used in comments/reactions SELECT
--                                              policies, both scoped TO authenticated.
--                                              No client or edge caller.
-- is_user_suspended            KEEP     KEEP   comments/reactions INSERT (public),
--                                              stories INSERT (authenticated).
-- is_user_verified             KEEP     KEEP   comments/reactions (public), stories
--                                              + storage story-images (authenticated).
-- active_experiment_keys       -        KEEP   Client (useExperiment). Returns only
--                                              enabled experiment keys.
-- admin_create_seed_stories_bulk -      KEEP   Admin UI; body raises 'forbidden'
--                                              unless has_role(auth.uid(),'admin').
-- admin_create_seed_story      -        KEEP   Admin UI; same admin check.
-- admin_delete_seed_story      -        KEEP   Admin UI; same admin check.
-- admin_held_reviews_for_user  -        KEEP   Admin UI; WHERE current_user_has_role
--                                              ('admin') -> non-admins get 0 rows.
-- admin_list_members           -        KEEP   Admin UI; same admin check.
-- create_aliased_story         -        KEEP   Admin UI; same admin check.
-- growth_composer_abandon_reasons -     KEEP   /admin/growth; WHERE has_role admin.
-- growth_weekly_funnel         -        KEEP   /admin/growth; WHERE has_role admin.
-- is_username_available        -        KEEP   Client (UsernameCreation, useProfile).
-- log_file_access              -        REVOKE Only client caller is
--                                              useSecureStorageAccess, which nothing
--                                              imports (dead code). No edge caller.
--                                              Let any signed-in user write arbitrary
--                                              rows into file_access_logs.
-- log_security_event           -        KEEP*  Live client callers (useSecurityAudit
--                                              via useVerification, useProfileCreation,
--                                              useSecurityMonitoring...). User id is
--                                              COALESCE(auth.uid(), p_user_id), so a
--                                              signed-in caller cannot spoof another
--                                              user. *FLAGGED: callers can still forge
--                                              arbitrary action/details rows. Edge
--                                              callers use service_role.
-- search_stories_by_phone      -        UNCHANGED  Pending legal decision; do not
--                                              touch in this migration.
-- search_subject_preview       -        KEEP   Client (search teaser).
-- set_story_subject_phone_hash -        KEEP   Client (useStories after insert).
--                                              Body is scoped to user_id = auth.uid(),
--                                              so the story id cannot be spoofed.
-- subject_search_interest      -        KEEP   Client (search).
-- validate_file_upload         -        REVOKE Only reachable through
--                                              SecurityProvider context, and nothing
--                                              calls useSecurityContext (dead path).
--                                              Pure check, no reason to be exposed.
-- ----------------------------------------------------------------------------
-- Net advisor effect: anon findings 9 -> 8, authenticated findings 26 -> 24.
-- The remaining anon findings are policy-driven; see the optional block at the
-- bottom for how to clear most of them.
-- =============================================================================

-- Migration runner wraps this file in a single transaction.

-- is_seed_story: authenticated-only policies; remove anon/PUBLIC.
REVOKE EXECUTE ON FUNCTION public.is_seed_story(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_seed_story(uuid) TO authenticated, service_role;

-- log_file_access: no live caller; service_role only.
REVOKE EXECUTE ON FUNCTION public.log_file_access(uuid, text, text, text, inet, text)
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.log_file_access(uuid, text, text, text, inet, text)
  TO service_role;

-- validate_file_upload: no live caller; service_role only.
REVOKE EXECUTE ON FUNCTION public.validate_file_upload(text, bigint, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.validate_file_upload(text, bigint, text, text)
  TO service_role;

-- Everything else in the table above is intentionally left as-is.

-- =============================================================================
-- RLS initplan fix: wrap auth.uid()/auth.jwt()/auth.role() in (SELECT ...) so
-- Postgres evaluates them once per statement instead of once per row.
-- Idempotent: already-wrapped calls are skipped by the lookbehind, and policies
-- with nothing to change are skipped entirely. On 2026-09-30 this touches
-- exactly the three policies the performance advisor flags:
--   story_tags "Story tags follow story visibility"
--   growth_experiments "Admins manage experiments"
--   search_alerts "Users manage own search alerts"
-- =============================================================================
DO $$ DECLARE p record; nq text; nw text; stmt text; BEGIN
FOR p IN SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies WHERE schemaname='public' AND (coalesce(qual,'')||coalesce(with_check,'')) ~ 'auth\.(uid|jwt|role)\(\)' LOOP
  nq := regexp_replace(coalesce(p.qual,''), '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(SELECT auth.\1())', 'g');
  nw := regexp_replace(coalesce(p.with_check,''), '(?<!SELECT )auth\.(uid|jwt|role)\(\)', '(SELECT auth.\1())', 'g');
  CONTINUE WHEN nq = coalesce(p.qual,'') AND nw = coalesce(p.with_check,'');
  stmt := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  IF p.qual IS NOT NULL THEN stmt := stmt || ' USING (' || nq || ')'; END IF;
  IF p.with_check IS NOT NULL THEN stmt := stmt || ' WITH CHECK (' || nw || ')'; END IF;
  EXECUTE stmt; END LOOP; END $$;

-- Post-apply verification (expect: f, f, f, t, t):
--   select has_function_privilege('anon','public.is_seed_story(uuid)','EXECUTE'),
--          has_function_privilege('authenticated','public.log_file_access(uuid,text,text,text,inet,text)','EXECUTE'),
--          has_function_privilege('authenticated','public.validate_file_upload(text,bigint,text,text)','EXECUTE'),
--          has_function_privilege('authenticated','public.is_seed_story(uuid)','EXECUTE'),
--          has_function_privilege('service_role','public.log_file_access(uuid,text,text,text,inet,text)','EXECUTE');

-- =============================================================================
-- OPTIONAL FOLLOW-UP (NOT executed; needs an owner decision)
-- The comments/reactions INSERT policies and the account_deletion_feedback
-- admin-read policy are scoped to role `public`, which is the only reason anon
-- still needs has_role / get_story_owner / is_blocked / is_user_suspended /
-- is_user_verified. Every one of them requires auth.uid() to be non-null, so
-- they can never pass for anon. Retargeting them to `authenticated` would let
-- anon lose EXECUTE on all five:
--
--   ALTER POLICY "Verified users can create comments"  ON public.comments  TO authenticated;
--   ALTER POLICY "Verified users can create reactions" ON public.reactions TO authenticated;
--   ALTER POLICY "admin read deletion feedback" ON public.account_deletion_feedback TO authenticated;
--   REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)  FROM PUBLIC, anon;
--   REVOKE EXECUTE ON FUNCTION public.get_story_owner(uuid)           FROM PUBLIC, anon;
--   REVOKE EXECUTE ON FUNCTION public.is_blocked(uuid, uuid)          FROM PUBLIC, anon;
--   REVOKE EXECUTE ON FUNCTION public.is_user_suspended(uuid)         FROM PUBLIC, anon;
--   REVOKE EXECUTE ON FUNCTION public.is_user_verified(uuid)          FROM PUBLIC, anon;
--   GRANT  EXECUTE ON FUNCTION public.has_role(uuid, public.app_role), public.get_story_owner(uuid),
--          public.is_blocked(uuid, uuid), public.is_user_suspended(uuid), public.is_user_verified(uuid)
--          TO authenticated, service_role;
--
-- Suggested body fix for detect_suspicious_activity (keeps the anon client call
-- working but stops attributing rows to a caller-chosen user):
--   v_uid uuid := auth.uid();   -- instead of COALESCE(auth.uid(), p_user_id)
-- =============================================================================
