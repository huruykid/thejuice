-- Fix security warnings: Set search_path for functions

-- Fix prevent_self_role_modification function
CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent users from modifying their own roles unless they are admin
  IF NEW.user_id = auth.uid() AND NOT current_user_has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Users cannot modify their own roles';
  END IF;
  
  -- Log all role modification attempts
  PERFORM public.log_security_event(
    COALESCE(auth.uid(), NEW.user_id),
    'role_modification_attempt',
    'user_role',
    NEW.id::text,
    jsonb_build_object(
      'target_user_id', NEW.user_id,
      'role', NEW.role,
      'modifier_user_id', auth.uid()
    )
  );
  
  RETURN NEW;
END;
$$;

-- Fix validate_file_upload function
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  file_name text,
  file_size bigint,
  mime_type text,
  bucket_name text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  max_size bigint;
  allowed_types text[];
BEGIN
  -- Set size limits and allowed types based on bucket
  CASE bucket_name
    WHEN 'verification-selfies' THEN
      max_size := 10485760; -- 10MB
      allowed_types := ARRAY['image/jpeg', 'image/png', 'image/webp'];
    WHEN 'story-images' THEN
      max_size := 5242880; -- 5MB
      allowed_types := ARRAY['image/jpeg', 'image/png', 'image/webp'];
    ELSE
      RETURN false;
  END CASE;

  -- Validate file size
  IF file_size > max_size THEN
    RETURN false;
  END IF;

  -- Validate MIME type
  IF NOT (mime_type = ANY(allowed_types)) THEN
    RETURN false;
  END IF;

  -- Validate file extension matches MIME type
  IF mime_type = 'image/jpeg' AND NOT (file_name ~* '\.(jpg|jpeg)$') THEN
    RETURN false;
  END IF;
  
  IF mime_type = 'image/png' AND NOT (file_name ~* '\.png$') THEN
    RETURN false;
  END IF;
  
  IF mime_type = 'image/webp' AND NOT (file_name ~* '\.webp$') THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Fix check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15,
  p_block_minutes integer DEFAULT 60
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_record record;
  window_start_time timestamp with time zone;
BEGIN
  window_start_time := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Get current rate limit record
  SELECT * INTO current_record
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND action_type = p_action_type
    AND window_start > window_start_time
  ORDER BY window_start DESC
  LIMIT 1;

  -- Check if currently blocked
  IF current_record.blocked_until IS NOT NULL AND current_record.blocked_until > now() THEN
    RETURN false;
  END IF;

  -- If no recent record, create new one
  IF current_record IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, window_start)
    VALUES (p_identifier, p_action_type, 1, now());
    RETURN true;
  END IF;

  -- Increment attempt count
  UPDATE public.rate_limits
  SET 
    attempt_count = attempt_count + 1,
    updated_at = now(),
    blocked_until = CASE 
      WHEN attempt_count + 1 >= p_max_attempts THEN now() + (p_block_minutes || ' minutes')::interval
      ELSE blocked_until
    END
  WHERE id = current_record.id;

  -- Return false if limit exceeded
  IF current_record.attempt_count >= p_max_attempts THEN
    -- Log security event for rate limit exceeded
    PERFORM public.log_security_event(
      auth.uid(),
      'rate_limit_exceeded',
      'rate_limit',
      current_record.id::text,
      jsonb_build_object(
        'identifier', p_identifier,
        'action_type', p_action_type,
        'attempt_count', current_record.attempt_count + 1
      )
    );
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Fix detect_suspicious_activity function
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  p_user_id uuid,
  p_activity_type text,
  p_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_activity_count integer;
  threshold integer;
BEGIN
  -- Set thresholds based on activity type
  CASE p_activity_type
    WHEN 'failed_login' THEN threshold := 3;
    WHEN 'profile_update' THEN threshold := 5;
    WHEN 'file_upload' THEN threshold := 10;
    WHEN 'search_query' THEN threshold := 50;
    ELSE threshold := 10;
  END CASE;

  -- Count recent activities of this type
  SELECT COUNT(*)
  INTO recent_activity_count
  FROM public.security_audit_logs
  WHERE user_id = p_user_id
    AND action LIKE '%' || p_activity_type || '%'
    AND created_at > now() - interval '1 hour';

  -- Log suspicious activity if threshold exceeded
  IF recent_activity_count >= threshold THEN
    PERFORM public.log_security_event(
      p_user_id,
      'suspicious_activity_detected',
      'security',
      NULL,
      jsonb_build_object(
        'activity_type', p_activity_type,
        'recent_count', recent_activity_count,
        'threshold', threshold,
        'details', p_details
      )
    );
  END IF;
END;
$$;