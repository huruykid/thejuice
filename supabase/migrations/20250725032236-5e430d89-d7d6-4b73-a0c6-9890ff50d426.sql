-- Make the verification-selfies bucket public so admin can view selfies
UPDATE storage.buckets 
SET public = true 
WHERE id = 'verification-selfies';

-- Add permissive policies for viewing verification selfies
CREATE POLICY "Admins can view verification selfies" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'verification-selfies' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND anonymous_username = 'admin'
  )
);

-- Allow public access to verification selfies (since bucket is now public)
CREATE POLICY "Public access to verification selfies" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'verification-selfies');