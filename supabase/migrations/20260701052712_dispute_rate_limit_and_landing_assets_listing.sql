-- 1. Rate-limit public dispute submissions. dispute_requests intentionally accepts inserts
-- from unauthenticated visitors (a woman named in a story has no Juice account and
-- shouldn't need one to request removal), but nothing stopped unlimited submissions from a
-- single visitor. check_rate_limit() derives its bucket key server-side (auth.uid() if
-- logged in, else the x-forwarded-for IP) and ignores client-supplied thresholds, so it's
-- safe to call from an anonymous RLS check.
create or replace function public.check_rate_limit(p_identifier text, p_action_type text, p_max_attempts integer DEFAULT 5, p_window_minutes integer DEFAULT 15, p_block_minutes integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_record record;
  window_start_time timestamptz;
  v_ip text;
  v_key text;
  v_max int;
  v_window int;
  v_block int;
BEGIN
  -- Server-side limits per action. Client-supplied p_max_attempts / p_window_minutes /
  -- p_block_minutes are intentionally IGNORED (they were attacker-controllable).
  CASE p_action_type
    WHEN 'login_attempt' THEN v_max := 5;  v_window := 15; v_block := 60;
    WHEN 'story_create'  THEN v_max := 10; v_window := 60; v_block := 60;
    WHEN 'dispute_submit' THEN v_max := 5; v_window := 60; v_block := 120;
    ELSE                      v_max := 20; v_window := 15; v_block := 30;
  END CASE;

  -- Server-derived bucket key: authenticated -> uid (from JWT), else client IP from the
  -- proxy header. The caller's p_identifier is NOT used as the key.
  v_ip := nullif(btrim(split_part(
            coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
            ',', 1)), '');
  v_key := p_action_type || ':' || coalesce(auth.uid()::text, v_ip, 'unknown');

  window_start_time := now() - (v_window || ' minutes')::interval;

  SELECT * INTO current_record
  FROM public.rate_limits
  WHERE identifier = v_key
    AND action_type = p_action_type
    AND window_start > window_start_time
  ORDER BY window_start DESC
  LIMIT 1;

  IF current_record.blocked_until IS NOT NULL AND current_record.blocked_until > now() THEN
    RETURN false;
  END IF;

  IF current_record IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, window_start)
    VALUES (v_key, p_action_type, 1, now());
    RETURN true;
  END IF;

  UPDATE public.rate_limits
  SET attempt_count = attempt_count + 1,
      updated_at = now(),
      blocked_until = CASE
        WHEN attempt_count + 1 >= v_max THEN now() + (v_block || ' minutes')::interval
        ELSE blocked_until
      END
  WHERE id = current_record.id;

  IF current_record.attempt_count >= v_max THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'rate_limit_exceeded',
      'rate_limit',
      current_record.id::text,
      jsonb_build_object('key', v_key, 'action_type', p_action_type,
                         'attempt_count', current_record.attempt_count + 1)
    );
    RETURN false;
  END IF;

  RETURN true;
END;
$function$;

-- Gate the public dispute-submission insert on the rate limiter. 5 submissions per hour
-- per IP/session, then a 2-hour block — generous for a genuine one-off request, tight
-- enough to stop the moderation queue from being flooded.
drop policy if exists "Anyone can submit dispute" on public.dispute_requests;
create policy "Anyone can submit dispute" on public.dispute_requests
  for insert
  with check (public.check_rate_limit('dispute_submit', 'dispute_submit'));

-- 2. landing-assets is a public bucket, but public-bucket object fetches go through the
-- CDN via getPublicUrl(), not through storage.objects RLS — the "read" policy here only
-- controlled the list()/API-listing path, which nothing in the app uses (uploads target
-- fixed filenames; the landing page reads via getPublicUrl). Scope listing to admins so
-- the bucket's contents can't be enumerated by a random visitor; public image URLs for
-- known filenames are unaffected.
drop policy if exists "landing-assets read" on storage.objects;
create policy "landing-assets read" on storage.objects
  for select
  to authenticated
  using (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));
