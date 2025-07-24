-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    code := upper(
      substr(
        encode(
          gen_random_bytes(6), 
          'base32'
        ), 
        1, 
        8
      )
    );
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.invite_codes WHERE invite_codes.code = code) INTO exists_check;
    
    -- If code doesn't exist, return it
    IF NOT exists_check THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_invite_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_invite_stats (user_id, invites_remaining, invites_sent, invites_used)
  VALUES (NEW.id, 3, 0, 0);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code TEXT, new_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
DECLARE
  invite_record RECORD;
  creator_id UUID;
BEGIN
  -- Find the invite code
  SELECT * INTO invite_record 
  FROM public.invite_codes 
  WHERE code = invite_code 
    AND used_by IS NULL 
    AND expires_at > now();
  
  -- If invite code doesn't exist or is already used
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  creator_id := invite_record.created_by;
  
  -- Mark invite as used
  UPDATE public.invite_codes 
  SET used_by = new_user_id, used_at = now()
  WHERE id = invite_record.id;
  
  -- Update creator's stats
  UPDATE public.user_invite_stats 
  SET invites_used = invites_used + 1,
      updated_at = now()
  WHERE user_id = creator_id;
  
  RETURN TRUE;
END;
$$;