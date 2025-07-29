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
$function$;

-- Create trigger for admin role monitoring
DROP TRIGGER IF EXISTS audit_admin_role_assignments_trigger ON public.user_roles;
CREATE TRIGGER audit_admin_role_assignments_trigger
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_role_assignments();