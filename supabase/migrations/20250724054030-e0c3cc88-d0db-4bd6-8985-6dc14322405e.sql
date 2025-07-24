-- Create profiles table for user data including anonymous username
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Function to create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Profile will be created separately via the app after username selection
  RETURN NEW;
END;
$$;

-- Trigger to potentially handle profile creation (currently just passes through)
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Add trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update stories table to reference profiles instead of codenames
ALTER TABLE public.stories DROP COLUMN IF EXISTS codename_id;
ALTER TABLE public.stories ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update comments to use profiles
ALTER TABLE public.comments ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Function to check if username is available
CREATE OR REPLACE FUNCTION public.is_username_available(username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE anonymous_username = username
  );
$$;