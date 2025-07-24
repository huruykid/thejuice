-- Remove the foreign key constraint temporarily to allow system codes
ALTER TABLE public.invite_codes DROP CONSTRAINT IF EXISTS invite_codes_created_by_fkey;

-- Make created_by nullable for system codes
ALTER TABLE public.invite_codes ALTER COLUMN created_by DROP NOT NULL;

-- Insert master invite code with null created_by (system code)
INSERT INTO public.invite_codes (
  code, 
  created_by, 
  expires_at
) VALUES (
  'ORANGE-2024',
  NULL, -- System code has no creator
  '2099-12-31 23:59:59+00'
) ON CONFLICT (code) DO NOTHING;

-- Re-add foreign key constraint but allow nulls
ALTER TABLE public.invite_codes 
ADD CONSTRAINT invite_codes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to handle system codes
DROP POLICY IF EXISTS "Users can view their own invite codes" ON public.invite_codes;
CREATE POLICY "Users can view their own invite codes" 
ON public.invite_codes 
FOR SELECT 
USING (auth.uid() = created_by AND created_by IS NOT NULL);

DROP POLICY IF EXISTS "Users can create invite codes" ON public.invite_codes;
CREATE POLICY "Users can create invite codes" 
ON public.invite_codes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND created_by IS NOT NULL);

-- Update the validation function
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
    RETURN TRUE;
  END IF;
  
  -- Find the invite code (normal user codes)
  SELECT * INTO invite_record 
  FROM public.invite_codes 
  WHERE code = invite_code 
    AND used_by IS NULL 
    AND expires_at > now()
    AND created_by IS NOT NULL; -- Only process user-created codes
  
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