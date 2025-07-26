-- Fix RLS Policy Gaps and Strengthen Security

-- 1. Create audit log table for security events
CREATE TABLE public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view security audit logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (current_user_has_role('admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- 2. Create security definer function for verification check
CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_verifications
    WHERE user_id = _user_id
      AND verification_status = 'approved'
  );
$$;

-- 3. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_details
  );
END;
$$;

-- 4. Fix invite_codes policies - remove overly permissive system update
DROP POLICY IF EXISTS "System can update invite codes when used" ON public.invite_codes;

-- Create more specific policy for invite code usage
CREATE POLICY "Invite codes can be marked as used during signup" 
ON public.invite_codes 
FOR UPDATE 
USING (used_by IS NULL AND expires_at > now())
WITH CHECK (used_by IS NOT NULL AND used_at IS NOT NULL);

-- 5. Fix user_invite_stats policies - add proper WITH CHECK
DROP POLICY IF EXISTS "System can insert invite stats" ON public.user_invite_stats;

CREATE POLICY "System can insert invite stats for new users" 
ON public.user_invite_stats 
FOR INSERT 
WITH CHECK (user_id IS NOT NULL);

-- 6. Update reactions policy to use security definer function
DROP POLICY IF EXISTS "Verified users can create reactions" ON public.reactions;

CREATE POLICY "Verified users can create reactions" 
ON public.reactions 
FOR INSERT 
WITH CHECK (public.is_user_verified(auth.uid()));

-- 7. Update comments policy to use security definer function
DROP POLICY IF EXISTS "Verified users can create comments" ON public.comments;

CREATE POLICY "Verified users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  public.is_user_verified(auth.uid())
);

-- 8. Update stories policy to use security definer function
DROP POLICY IF EXISTS "Verified users can create stories" ON public.stories;

CREATE POLICY "Verified users can create stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  public.is_user_verified(auth.uid())
);

-- 9. Add trigger for role change auditing
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'role_granted',
      'user_role',
      NEW.id::text,
      jsonb_build_object('role', NEW.role)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.log_security_event(
      OLD.user_id,
      'role_revoked',
      'user_role',
      OLD.id::text,
      jsonb_build_object('role', OLD.role)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for role auditing
CREATE TRIGGER audit_user_role_changes
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_role_changes();

-- 10. Add trigger for verification status changes
CREATE OR REPLACE FUNCTION public.audit_verification_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.verification_status != NEW.verification_status THEN
    PERFORM public.log_security_event(
      NEW.user_id,
      'verification_status_changed',
      'user_verification',
      NEW.id::text,
      jsonb_build_object(
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status,
        'notes', NEW.notes
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for verification auditing
CREATE TRIGGER audit_verification_changes
  AFTER UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_verification_changes();

-- 11. Enhanced phone number validation function
CREATE OR REPLACE FUNCTION public.validate_phone_number(phone_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Allow NULL or empty phone numbers
  IF phone_param IS NULL OR trim(phone_param) = '' THEN
    RETURN true;
  END IF;
  
  -- Basic phone number validation (US format)
  -- Allows: +1234567890, (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  RETURN phone_param ~ '^\+?1?[-.\s()]?(\d{3})[-.\s()]?(\d{3})[-.\s()]?(\d{4})$';
END;
$$;

-- 12. Add phone validation trigger to profiles
CREATE OR REPLACE FUNCTION public.validate_profile_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Validate username if changed
  IF NEW.anonymous_username != OLD.anonymous_username AND NOT public.validate_username(NEW.anonymous_username) THEN
    RAISE EXCEPTION 'Invalid username: must be 3-20 characters, alphanumeric with _ or -, and not reserved';
  END IF;
  
  -- Validate phone number if provided
  IF NEW.phone_number IS NOT NULL AND NOT public.validate_phone_number(NEW.phone_number) THEN
    RAISE EXCEPTION 'Invalid phone number format';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile updates
CREATE TRIGGER validate_profile_before_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_before_update();