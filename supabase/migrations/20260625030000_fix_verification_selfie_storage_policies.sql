-- Lovable scan fixes (applied to prod 2026-06-25):
--  * Dedupe the duplicate INSERT policy on verification-selfies (two identical policies
--    existed: "...selfie" and "...selfies").
--  * Let admins delete verification selfies directly via storage RLS (previously only the
--    owner or the service-role function could).

DROP POLICY IF EXISTS "Users can upload their own verification selfie" ON storage.objects;

DROP POLICY IF EXISTS "Admins can delete verification selfies" ON storage.objects;
CREATE POLICY "Admins can delete verification selfies"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-selfies'
  AND current_user_has_role('admin'::app_role)
);
