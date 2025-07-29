-- Add security trigger to prevent privilege escalation via username changes
CREATE OR REPLACE FUNCTION public.prevent_admin_username_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log suspicious attempts to use admin usernames
  IF lower(NEW.anonymous_username) = 'admin' OR 
     lower(NEW.anonymous_username) = 'administrator' OR
     lower(NEW.anonymous_username) = 'root' THEN
    
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

-- Create trigger for username validation
DROP TRIGGER IF EXISTS prevent_admin_username_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_admin_username_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_username_escalation();