-- Fix remaining security warnings

-- Fix WARN 1 & 2: Add SET search_path to functions that don't have it
CREATE OR REPLACE FUNCTION public.validate_story_content(content_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Basic content validation
  RETURN (
    content_param IS NOT NULL AND
    length(trim(content_param)) > 0 AND
    length(content_param) <= 5000 AND
    -- Prevent scripts and potentially dangerous content
    content_param !~* '<script|javascript:|data:|vbscript:|onload|onerror'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_username(username_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  reserved_names text[] := ARRAY[
    'admin', 'administrator', 'root', 'system', 'support', 'help',
    'api', 'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'news',
    'about', 'contact', 'terms', 'privacy', 'security', 'login',
    'signup', 'register', 'auth', 'oauth', 'settings', 'profile',
    'dashboard', 'account', 'user', 'users', 'null', 'undefined',
    'anonymous', 'guest', 'test', 'demo', 'sample', 'example'
  ];
BEGIN
  RETURN (
    username_param IS NOT NULL AND
    length(trim(username_param)) >= 3 AND
    length(username_param) <= 20 AND
    username_param ~ '^[a-zA-Z0-9_-]+$' AND
    NOT (lower(username_param) = ANY(reserved_names)) AND
    username_param !~* '(admin|root|system|support|help|api|www|mail|ftp)'
  );
END;
$$;