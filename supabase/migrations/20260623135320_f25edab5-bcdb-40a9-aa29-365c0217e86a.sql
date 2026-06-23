CREATE OR REPLACE FUNCTION public.prevent_admin_username_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only check when username is actually being set or changed
  IF TG_OP = 'UPDATE' AND NEW.anonymous_username IS NOT DISTINCT FROM OLD.anonymous_username THEN
    RETURN NEW;
  END IF;

  IF lower(NEW.anonymous_username) IN ('admin', 'administrator', 'root') THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'suspicious_username_attempt',
      'profile',
      NEW.id::text,
      jsonb_build_object(
        'attempted_username', NEW.anonymous_username,
        'old_username', COALESCE(OLD.anonymous_username, 'null')
      )
    );
    RAISE EXCEPTION 'Username "%" is reserved and cannot be used', NEW.anonymous_username;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_profile_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only validate username if it actually changed
  IF NEW.anonymous_username IS DISTINCT FROM OLD.anonymous_username
     AND NOT public.validate_username(NEW.anonymous_username) THEN
    RAISE EXCEPTION 'Invalid username: must be 3-20 characters, alphanumeric with _ or -, and not reserved';
  END IF;

  -- Only validate phone if it actually changed
  IF NEW.phone_number IS DISTINCT FROM OLD.phone_number
     AND NEW.phone_number IS NOT NULL
     AND NOT public.validate_phone_number(NEW.phone_number) THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;

  RETURN NEW;
END;
$function$;