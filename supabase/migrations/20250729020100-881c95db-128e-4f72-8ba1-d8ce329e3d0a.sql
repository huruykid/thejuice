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
$function$;