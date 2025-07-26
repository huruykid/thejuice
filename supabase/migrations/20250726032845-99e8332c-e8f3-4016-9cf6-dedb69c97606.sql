-- Security Enhancement Migration
-- Fix RLS policies and strengthen security

-- 1. Fix profiles UPDATE policy - add WITH CHECK clause
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix user_verifications UPDATE policy - add WITH CHECK clause  
DROP POLICY IF EXISTS "Users can update their own verification" ON public.user_verifications;

CREATE POLICY "Users can update their own verification" 
ON public.user_verifications 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent users from self-approving
  (verification_status != 'approved' OR current_user_has_role('admin'::app_role))
);

-- 3. Move pgcrypto extension from public to extensions schema if it exists
-- This addresses the "Extension in Public" warning
DO $$
BEGIN
  -- Check if pgcrypto exists in public schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pgcrypto' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Move the extension
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
    
    -- Update search_path for functions that might use pgcrypto
    ALTER DATABASE postgres SET search_path TO "$user", public, extensions;
  END IF;
END
$$;

-- 4. Strengthen file access policies
DROP POLICY IF EXISTS "System can insert file access logs" ON public.file_access_logs;

CREATE POLICY "System can insert file access logs" 
ON public.file_access_logs 
FOR INSERT 
WITH CHECK (
  user_id IS NOT NULL AND
  bucket_id IS NOT NULL AND
  object_path IS NOT NULL AND
  action IS NOT NULL
);

-- 5. Add check constraints for data integrity
ALTER TABLE public.user_verifications 
ADD CONSTRAINT check_verification_status 
CHECK (verification_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.reactions 
ADD CONSTRAINT check_reaction_type 
CHECK (reaction_type IN ('like', 'love', 'angry', 'sad', 'laugh'));

-- 6. Create function to validate email domains (prevent disposable emails)
CREATE OR REPLACE FUNCTION public.is_valid_email_domain(email_param text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  domain_part text;
  blocked_domains text[] := ARRAY[
    '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 
    'tempmail.org', 'yopmail.com', 'throwaway.email'
  ];
BEGIN
  -- Extract domain from email
  domain_part := lower(split_part(email_param, '@', 2));
  
  -- Check if domain is in blocked list
  RETURN NOT (domain_part = ANY(blocked_domains));
END;
$$;