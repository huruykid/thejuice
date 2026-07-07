-- P2 hardening from SECURITY_AUDIT_2026-07-02.md + advisor follow-up.
--
-- Part 1 (P2-1): global DB-level rate limit on anonymous story inserts.
-- anon has no stable identity at the DB layer, so this is a global cap
-- (30/hour) that stops a script from burying the moderation queue;
-- per-IP throttling stays in the edge/client layer.
--
-- Part 2: shrink the RPC surface. Every SECURITY DEFINER function is
-- executable by anon/authenticated via /rest/v1/rpc/* by default.
-- Revoke EXECUTE where no client/policy path needs it:
--   * both roles: trigger-only functions, helpers only called from other
--     SECURITY DEFINER functions (those run as the definer, not the caller),
--     and functions with no remaining callers.
--   * anon only: RPCs the client calls exclusively after login. This also
--     closes a log-spoofing vector in log_security_event/log_file_access,
--     where anon (auth.uid() IS NULL) could write arbitrary p_user_id rows.
-- Functions referenced in RLS policies (has_role, is_user_verified, ...)
-- and pre-login RPCs (check_rate_limit, detect_suspicious_activity) keep
-- their grants: policy expressions execute as the querying role.

-- ---------------------------------------------------------------------------
-- Part 1: P2-1 anonymous story insert rate limit
-- ---------------------------------------------------------------------------

create or replace function public.check_anon_story_rate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null and new.submitted_anonymously then
    if (select count(*) from public.stories
        where submitted_anonymously and user_id is null
          and created_at > now() - interval '1 hour') >= 30 then
      raise exception 'Anonymous submissions are temporarily paused. Please try again later.';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_anon_story_rate on public.stories;
create trigger trg_anon_story_rate before insert on public.stories
for each row execute function public.check_anon_story_rate();

-- The trigger function itself is not an RPC.
revoke execute on function public.check_anon_story_rate() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Part 2a: internal-only functions — no client, policy, or constraint callers
-- ---------------------------------------------------------------------------

revoke execute on function public.sync_story_comments_count() from anon, authenticated;
revoke execute on function public.sync_story_reactions_count() from anon, authenticated;
revoke execute on function public.generate_slug(title_text text) from anon, authenticated;
revoke execute on function public.generate_city_slug(city_name_param text) from anon, authenticated;
revoke execute on function public.normalize_city_name(city_input text) from anon, authenticated;
revoke execute on function public.normalize_phone_number(phone_input text) from anon, authenticated;
revoke execute on function public.validate_phone_number(phone_param text) from anon, authenticated;
revoke execute on function public.validate_story_content(content_param text) from anon, authenticated;
revoke execute on function public.validate_subject_phone(phone_param text) from anon, authenticated;
revoke execute on function public.validate_username(username_param text) from anon, authenticated;
revoke execute on function public.is_valid_email_domain(email_param text) from anon, authenticated;
revoke execute on function public.is_pg_net_exception_acceptable() from anon, authenticated;
revoke execute on function public.user_has_approved_post(_user_id uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Part 2b: post-login-only RPCs — keep authenticated, drop anon
-- ---------------------------------------------------------------------------

revoke execute on function public.admin_create_seed_story(p_content text, p_subject_name text, p_location text, p_communication integer, p_loyalty integer, p_vibe integer, p_emotional_safety integer, p_image_url text) from anon;
revoke execute on function public.log_security_event(p_user_id uuid, p_action text, p_resource_type text, p_resource_id text, p_details jsonb) from anon;
revoke execute on function public.log_file_access(p_user_id uuid, p_bucket_id text, p_object_path text, p_action text, p_ip_address inet, p_user_agent text) from anon;
revoke execute on function public.validate_file_upload(file_name text, file_size bigint, mime_type text, bucket_name text) from anon;
revoke execute on function public.is_username_available(username text) from anon;
