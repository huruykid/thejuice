-- Correction to 20260706120000: the REVOKEs there removed role-specific
-- grants, but Postgres functions default to EXECUTE for PUBLIC, and anon/
-- authenticated inherit through it — so the lockdown had no effect (verified
-- via has_function_privilege). The fix is to revoke from PUBLIC and re-grant
-- explicitly to the roles that need each function. service_role is granted
-- everywhere edge functions call these (it loses PUBLIC inheritance too).

-- Internal-only: trigger functions, definer-called helpers, unused RPCs.
-- No client, policy, or constraint path — only service_role/postgres keep access.
do $$
declare fn text;
begin
  foreach fn in array array[
    'check_anon_story_rate()',
    'sync_story_comments_count()',
    'sync_story_reactions_count()',
    'generate_slug(title_text text)',
    'generate_city_slug(city_name_param text)',
    'normalize_city_name(city_input text)',
    'normalize_phone_number(phone_input text)',
    'validate_phone_number(phone_param text)',
    'validate_story_content(content_param text)',
    'validate_subject_phone(phone_param text)',
    'validate_username(username_param text)',
    'is_valid_email_domain(email_param text)',
    'is_pg_net_exception_acceptable()',
    'user_has_approved_post(_user_id uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', fn);
    execute format('grant execute on function public.%s to service_role', fn);
  end loop;
end $$;

-- Post-login-only RPCs: authenticated keeps access, anon (and PUBLIC) lose it.
do $$
declare fn text;
begin
  foreach fn in array array[
    'admin_create_seed_story(p_content text, p_subject_name text, p_location text, p_communication integer, p_loyalty integer, p_vibe integer, p_emotional_safety integer, p_image_url text)',
    'log_security_event(p_user_id uuid, p_action text, p_resource_type text, p_resource_id text, p_details jsonb)',
    'log_file_access(p_user_id uuid, p_bucket_id text, p_object_path text, p_action text, p_ip_address inet, p_user_agent text)',
    'validate_file_upload(file_name text, file_size bigint, mime_type text, bucket_name text)',
    'is_username_available(username text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated, service_role', fn);
  end loop;
end $$;
