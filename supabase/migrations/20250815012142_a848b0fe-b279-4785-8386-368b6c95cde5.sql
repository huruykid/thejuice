-- Create a function to automatically assign admin role to the test admin account
CREATE OR REPLACE FUNCTION public.assign_test_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this is the test admin email
  IF NEW.email = 'testing2424@gmail.com' THEN
    -- Insert admin role for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Log the admin role assignment
    PERFORM public.log_security_event(
      NEW.id,
      'test_admin_role_assigned',
      'user_role',
      NEW.id::text,
      jsonb_build_object(
        'email', NEW.email,
        'assigned_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign admin role to test account on signup
DROP TRIGGER IF EXISTS assign_test_admin_role_trigger ON auth.users;
CREATE TRIGGER assign_test_admin_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_test_admin_role();