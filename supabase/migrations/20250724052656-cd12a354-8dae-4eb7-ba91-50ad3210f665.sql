-- Create a special system user for master codes (or use a UUID that represents "system")
-- We'll use a special UUID that represents the system
-- Insert master invite code with a system UUID
INSERT INTO public.invite_codes (
  id,
  code, 
  created_by, 
  expires_at
) VALUES (
  gen_random_uuid(),
  'ORANGE-2024',
  '00000000-0000-0000-0000-000000000000'::uuid, -- System UUID
  '2099-12-31 23:59:59+00'
) ON CONFLICT (code) DO NOTHING;

-- Update RLS policy to allow the system master code to be viewed
DROP POLICY IF EXISTS "Anyone can view invite codes for validation" ON public.invite_codes;
CREATE POLICY "Anyone can view invite codes for validation" 
ON public.invite_codes 
FOR SELECT 
USING (
  (used_by IS NULL AND expires_at > now()) OR 
  (code = 'ORANGE-2024')
);

-- Update the invite code validation function
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
  -- Special handling for master code - always allow it
  IF upper(invite_code) = 'ORANGE-2024' THEN
    RETURN TRUE;
  END IF;
  
  -- Find the invite code (normal codes)
  SELECT * INTO invite_record 
  FROM public.invite_codes 
  WHERE code = invite_code 
    AND used_by IS NULL 
    AND expires_at > now()
    AND code != 'ORANGE-2024'; -- Exclude master code from normal processing
  
  -- If invite code doesn't exist or is already used
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  creator_id := invite_record.created_by;
  
  -- Mark invite as used
  UPDATE public.invite_codes 
  SET used_by = new_user_id, used_at = now()
  WHERE id = invite_record.id;
  
  -- Update creator's stats (only if creator is a real user, not system)
  IF creator_id != '00000000-0000-0000-0000-000000000000'::uuid THEN
    UPDATE public.user_invite_stats 
    SET invites_used = invites_used + 1,
        updated_at = now()
    WHERE user_id = creator_id;
  END IF;
  
  RETURN TRUE;
END;
$$;