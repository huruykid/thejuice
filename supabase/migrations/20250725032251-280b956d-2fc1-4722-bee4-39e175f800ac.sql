-- Make the verification-selfies bucket public so admin can view selfies
UPDATE storage.buckets 
SET public = true 
WHERE id = 'verification-selfies';