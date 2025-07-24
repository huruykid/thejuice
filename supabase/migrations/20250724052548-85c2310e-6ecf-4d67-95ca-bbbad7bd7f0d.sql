-- Insert master invite code that never expires and can be used multiple times
INSERT INTO public.invite_codes (
  code, 
  created_by, 
  expires_at
) VALUES (
  'ORANGE-2024',
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as creator, or we could use a system user
  '2099-12-31 23:59:59+00', -- Expires in year 2099 (essentially never)
  now()
) ON CONFLICT (code) DO NOTHING;

-- Update the invite code validation to allow the master code to be used multiple times
-- We'll modify the use_invite_code function to handle the master code specially
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
  -- Special handling for master code
  IF upper(invite_code) = 'ORANGE-2024' THEN
    -- Just return true for master code, don't mark as used
    RETURN TRUE;
  END IF;
  
  -- Find the invite code (normal codes)
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