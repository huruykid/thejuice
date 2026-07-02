-- Security: the audit/logging RPCs are SECURITY DEFINER and trusted a caller-
-- supplied p_user_id, letting any authenticated (or anon) caller forge audit
-- entries attributed to another user. Force the actor to auth.uid() whenever a
-- session exists; only trust the passed id for system/service contexts where
-- auth.uid() is null. This closes the forgery vector while keeping legitimate
-- self-logging and internal system logging working.

CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL::text,
  p_details jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (COALESCE(auth.uid(), p_user_id), p_action, p_resource_type, p_resource_id, p_details);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_file_access(
  p_user_id uuid,
  p_bucket_id text,
  p_object_path text,
  p_action text,
  p_ip_address inet DEFAULT NULL::inet,
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.file_access_logs (user_id, bucket_id, object_path, action, ip_address, user_agent)
  VALUES (COALESCE(auth.uid(), p_user_id), p_bucket_id, p_object_path, p_action, p_ip_address, p_user_agent);
END;
$function$;

CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  p_user_id uuid,
  p_activity_type text,
  p_details jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_activity_count integer;
  threshold integer;
  v_uid uuid := COALESCE(auth.uid(), p_user_id);
BEGIN
  CASE p_activity_type
    WHEN 'failed_login' THEN threshold := 3;
    WHEN 'profile_update' THEN threshold := 5;
    WHEN 'file_upload' THEN threshold := 10;
    WHEN 'search_query' THEN threshold := 50;
    ELSE threshold := 10;
  END CASE;

  SELECT COUNT(*) INTO recent_activity_count
  FROM public.security_audit_logs
  WHERE user_id = v_uid
    AND action LIKE '%' || p_activity_type || '%'
    AND created_at > now() - interval '1 hour';

  IF recent_activity_count >= threshold THEN
    PERFORM public.log_security_event(
      v_uid,
      'suspicious_activity_detected',
      'security',
      NULL,
      jsonb_build_object('activity_type', p_activity_type, 'recent_count', recent_activity_count, 'threshold', threshold, 'details', p_details)
    );
  END IF;
END;
$function$;

-- These two are only meaningful for an authenticated session; anon has no
-- legitimate reason to call them.
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_file_access(uuid, text, text, text, inet, text) FROM anon;
