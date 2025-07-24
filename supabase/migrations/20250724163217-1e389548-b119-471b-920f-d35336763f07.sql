-- Add new columns to profiles table for extended onboarding
ALTER TABLE public.profiles 
ADD COLUMN date_of_birth DATE,
ADD COLUMN city TEXT,
ADD COLUMN relationship_status TEXT CHECK (relationship_status IN ('single', 'talking', 'situationship', 'relationship', 'complicated', 'prefer_not_to_say'));

-- Add age validation constraint (must be 18+)
ALTER TABLE public.profiles 
ADD CONSTRAINT age_check CHECK (date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years'));

-- Update RLS policies to only allow approved users to access main app data
-- Update stories table policies
DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.stories;
CREATE POLICY "Verified users can create stories" 
ON public.stories 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.user_verifications 
    WHERE user_id = auth.uid() AND verification_status = 'approved'
  )
);

-- Update comments table policies  
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Verified users can create comments" 
ON public.comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.user_verifications 
    WHERE user_id = auth.uid() AND verification_status = 'approved'
  )
);

-- Update reactions table policies
DROP POLICY IF EXISTS "Anyone can create reactions" ON public.reactions;
CREATE POLICY "Verified users can create reactions" 
ON public.reactions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_verifications 
    WHERE user_id = auth.uid() AND verification_status = 'approved'
  )
);

-- Create admin RLS policy for user_verifications to allow admin access
CREATE POLICY "Admins can view all verifications" 
ON public.user_verifications 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND anonymous_username = 'admin'
  )
);

-- Add index for better performance on verification status queries
CREATE INDEX IF NOT EXISTS idx_user_verifications_status 
ON public.user_verifications(verification_status);

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id 
ON public.user_verifications(user_id);