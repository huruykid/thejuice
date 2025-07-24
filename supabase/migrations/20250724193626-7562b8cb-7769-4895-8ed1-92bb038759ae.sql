-- Fix the generate_invite_code function to use gen_random_uuid instead of gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
  uuid_str TEXT;
BEGIN
  LOOP
    -- Generate a random UUID and extract characters to create an 8-character code
    uuid_str := replace(gen_random_uuid()::text, '-', '');
    code := upper(substr(uuid_str, 1, 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.invite_codes WHERE invite_codes.code = code) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$function$