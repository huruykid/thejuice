-- Create storage policies for admin access to verification selfies
-- Admins can view all verification selfies
CREATE POLICY "Admins can view all verification selfies" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verification-selfies' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.anonymous_username = 'admin'
  )
);

-- Users can view their own verification selfies
CREATE POLICY "Users can view their own verification selfies" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verification-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload their own verification selfies
CREATE POLICY "Users can upload their own verification selfies" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'verification-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own verification selfies
CREATE POLICY "Users can update their own verification selfies" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'verification-selfies' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);