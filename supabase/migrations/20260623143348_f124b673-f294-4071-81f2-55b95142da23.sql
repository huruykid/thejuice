DELETE FROM public.user_verifications
WHERE user_id NOT IN (SELECT id FROM auth.users);

ALTER TABLE public.user_verifications
  ADD CONSTRAINT user_verifications_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;