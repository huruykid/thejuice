-- Fix critical security vulnerability: Remove admin username exception
CREATE OR REPLACE FUNCTION public.validate_username(username_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  reserved_names text[] := ARRAY[
    'administrator', 'root', 'system', 'support', 'help',
    'api', 'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'news',
    'about', 'contact', 'terms', 'privacy', 'security', 'login',
    'signup', 'register', 'auth', 'oauth', 'settings', 'profile',
    'dashboard', 'account', 'user', 'users', 'null', 'undefined',
    'anonymous', 'guest', 'test', 'demo', 'sample', 'example',
    'admin'  -- Remove the exception for 'admin' username
  ];
BEGIN
  RETURN (
    username_param IS NOT NULL AND
    length(trim(username_param)) >= 3 AND
    length(username_param) <= 20 AND
    username_param ~ '^[a-zA-Z0-9_-]+$' AND
    NOT (lower(username_param) = ANY(reserved_names)) AND
    username_param !~* '(administrator|root|system|support|help|api|www|mail|ftp|admin)'
  );
END;
$function$

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
$function$

-- Create trigger for username validation
DROP TRIGGER IF EXISTS prevent_admin_username_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_admin_username_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_admin_username_escalation();

-- Add trigger to log admin role assignments for monitoring
CREATE OR REPLACE FUNCTION public.audit_admin_role_assignments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log admin role assignments for security monitoring
  IF NEW.role = 'admin' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'admin_role_assigned',
      'user_role',
      NEW.id::text,
      jsonb_build_object(
        'assigned_by', auth.uid(),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$

-- Create trigger for admin role monitoring
DROP TRIGGER IF EXISTS audit_admin_role_assignments_trigger ON public.user_roles;
CREATE TRIGGER audit_admin_role_assignments_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_role_assignments();