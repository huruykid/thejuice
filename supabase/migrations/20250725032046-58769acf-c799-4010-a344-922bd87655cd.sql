-- Update the validation function to allow 'admin' as a special case for administrative users
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
    'anonymous', 'guest', 'test', 'demo', 'sample', 'example'
  ];
BEGIN
  -- Allow 'admin' as a special administrative username
  IF lower(username_param) = 'admin' THEN
    RETURN true;
  END IF;
  
  RETURN (
    username_param IS NOT NULL AND
    length(trim(username_param)) >= 3 AND
    length(username_param) <= 20 AND
    username_param ~ '^[a-zA-Z0-9_-]+$' AND
    NOT (lower(username_param) = ANY(reserved_names)) AND
    username_param !~* '(administrator|root|system|support|help|api|www|mail|ftp)'
  );
END;
$function$;

-- Now update your profile to have admin privileges
UPDATE profiles 
SET anonymous_username = 'admin' 
WHERE user_id = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed';