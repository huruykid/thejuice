-- Fix Security Issues: Move Extensions and Configure Auth

-- 1. Move pg_net extension from public to extensions schema
DO $$
BEGIN
  -- Create extensions schema if it doesn't exist
  CREATE SCHEMA IF NOT EXISTS extensions;
  
  -- Move pg_net extension to extensions schema
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pg_net' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pg_net SET SCHEMA extensions;
  END IF;
  
  -- Also move pgcrypto if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension 
    WHERE extname = 'pgcrypto' 
    AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  END IF;
  
  -- Update search_path to include extensions schema
  -- This ensures functions can still find the extensions
  ALTER DATABASE postgres SET search_path TO "$user", public, extensions;
  
END $$;

-- 2. Grant necessary permissions on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- 3. Update any functions that might reference the moved extensions
-- Re-create functions with proper search_path if needed
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
  uuid_str TEXT;
BEGIN
  LOOP
    -- Generate a random UUID and extract characters to create an 8-character code
    uuid_str := replace(gen_random_uuid()::text, '-', '');
    new_code := upper(substr(uuid_str, 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.invite_codes WHERE invite_codes.code = new_code) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;