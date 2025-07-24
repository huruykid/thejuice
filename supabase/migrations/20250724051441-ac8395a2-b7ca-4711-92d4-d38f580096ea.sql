-- Create invite codes table
CREATE TABLE public.invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Create user invite stats table
CREATE TABLE public.user_invite_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  invites_remaining INTEGER NOT NULL DEFAULT 3,
  invites_sent INTEGER NOT NULL DEFAULT 0,
  invites_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_invite_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invite_codes
CREATE POLICY "Users can view their own invite codes" 
ON public.invite_codes 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create invite codes" 
ON public.invite_codes 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Anyone can view invite codes for validation" 
ON public.invite_codes 
FOR SELECT 
USING (used_by IS NULL AND expires_at > now());

CREATE POLICY "System can update invite codes when used" 
ON public.invite_codes 
FOR UPDATE 
USING (true);

-- RLS Policies for user_invite_stats
CREATE POLICY "Users can view their own invite stats" 
ON public.user_invite_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own invite stats" 
ON public.user_invite_stats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert invite stats" 
ON public.user_invite_stats 
FOR INSERT 
WITH CHECK (true);

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invite stats for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_invite_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_invite_stats (user_id, invites_remaining, invites_sent, invites_used)
  VALUES (NEW.id, 3, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create invite stats when user signs up
CREATE TRIGGER on_auth_user_created_invite_stats
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_invite_stats();

-- Function to process invite code usage
CREATE OR REPLACE FUNCTION public.use_invite_code(invite_code TEXT, new_user_id UUID)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the update_updated_at_column trigger for user_invite_stats
CREATE TRIGGER update_user_invite_stats_updated_at
  BEFORE UPDATE ON public.user_invite_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();