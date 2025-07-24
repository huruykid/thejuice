-- Create storage bucket for verification selfies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('verification-selfies', 'verification-selfies', false);

-- Create policies for verification selfies storage
CREATE POLICY "Users can upload their own verification selfie" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'verification-selfies' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view verification selfies" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verification-selfies' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.uid()::text = (storage.foldername(name))[1])
);

-- Create table to track verification status
CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  selfie_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own verification" 
ON public.user_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification" 
ON public.user_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification" 
ON public.user_verifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_verifications_updated_at
BEFORE UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();