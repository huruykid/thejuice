-- Security Fix Phase 1: Database Security Hardening

-- 1. Add missing UPDATE policies for stories table
CREATE POLICY "Users can update their own stories" 
ON public.stories 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 2. Add missing UPDATE policies for comments table  
CREATE POLICY "Users can update their own comments" 
ON public.comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 3. Make user_id columns non-nullable for proper access control
ALTER TABLE public.stories ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.comments ALTER COLUMN user_id SET NOT NULL;

-- 4. Restrict profile visibility to authenticated users only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 5. Improve invite code security - restrict SELECT to specific use cases
DROP POLICY IF EXISTS "Anyone can view invite codes for validation" ON public.invite_codes;
CREATE POLICY "Limited invite code validation access" 
ON public.invite_codes 
FOR SELECT 
USING (
  -- Allow validation of unused, non-expired codes (no user context needed)
  (used_by IS NULL AND expires_at > now()) OR
  -- Allow users to see their own codes
  (auth.uid() = created_by AND created_by IS NOT NULL)
);

-- 6. Add rate limiting function for invite code generation
CREATE OR REPLACE FUNCTION public.check_invite_generation_rate_limit(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Check if user has generated more than 5 invite codes in the last hour
  SELECT COUNT(*)
  INTO recent_count
  FROM public.invite_codes
  WHERE created_by = user_id_param
    AND created_at > (now() - interval '1 hour');
    
  RETURN recent_count < 5;
END;
$$;

-- 7. Add content validation function for stories
CREATE OR REPLACE FUNCTION public.validate_story_content(content_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- 8. Add username validation function with reserved names
CREATE OR REPLACE FUNCTION public.validate_username(username_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
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

-- 9. Add validation triggers for stories
CREATE OR REPLACE FUNCTION public.validate_story_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate content
  IF NOT public.validate_story_content(NEW.content) THEN
    RAISE EXCEPTION 'Invalid story content';
  END IF;
  
  -- Validate ratings are within range
  IF NEW.emotional_safety_rating < 1 OR NEW.emotional_safety_rating > 5 OR
     NEW.overall_vibe_rating < 1 OR NEW.overall_vibe_rating > 5 OR
     NEW.communication_rating < 1 OR NEW.communication_rating > 5 OR
     NEW.loyalty_rating < 1 OR NEW.loyalty_rating > 5 THEN
    RAISE EXCEPTION 'Ratings must be between 1 and 5';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_story_content_trigger
  BEFORE INSERT OR UPDATE ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_story_before_insert();

-- 10. Add validation trigger for profiles
CREATE OR REPLACE FUNCTION public.validate_profile_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Validate username
  IF NOT public.validate_username(NEW.anonymous_username) THEN
    RAISE EXCEPTION 'Invalid username: must be 3-20 characters, alphanumeric with _ or -, and not reserved';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_username_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_before_insert();

-- 11. Update the username availability function to use the new validation
CREATE OR REPLACE FUNCTION public.is_username_available(username text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 
    public.validate_username(username) AND
    NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE anonymous_username = username
    );
$$;