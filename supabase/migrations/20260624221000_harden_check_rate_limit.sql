-- P1-1: Make check_rate_limit non-bypassable. Applied to prod 2026-06-24 via connector.
--
-- Before: the caller supplied the bucket identifier AND the limits, so an attacker could
-- vary p_identifier to reset the counter and pass a huge p_max_attempts to disable it.
-- After: limits are server-side per action_type (client params ignored), and the bucket
-- key is derived server-side from auth.uid() (JWT, unspoofable) or, for unauthenticated
-- calls like login, the proxy-set client IP. Signature is unchanged for backward compat.

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15,
  p_block_minutes integer DEFAULT 60
)
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
  CASE p_action_type
    WHEN 'login_attempt' THEN v_max := 5;  v_window := 15; v_block := 60;
    WHEN 'story_create'  THEN v_max := 10; v_window := 60; v_block := 60;
    ELSE                      v_max := 20; v_window := 15; v_block := 30;
  END CASE;

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