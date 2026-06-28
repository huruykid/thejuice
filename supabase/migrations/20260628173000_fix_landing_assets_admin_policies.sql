-- Bugfix: admin landing-photo uploads were rejected with "new row violates row-level
-- security policy for table objects".
--
-- Root cause: has_role(auth.uid(), 'admin') does NOT evaluate correctly inside a
-- storage.objects INSERT WITH CHECK. It returns true when called standalone in the same
-- authenticated context, yet the INSERT policy that wraps it still rejects the row.
-- The working admin storage policies (verification-selfie view/delete) use
-- current_user_has_role('admin'), which evaluates correctly in that context. Switch all
-- three landing-assets policies to that proven function.

drop policy if exists "landing-assets admin insert" on storage.objects;
create policy "landing-assets admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));

drop policy if exists "landing-assets admin update" on storage.objects;
create policy "landing-assets admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role))
  with check (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));

drop policy if exists "landing-assets admin delete" on storage.objects;
create policy "landing-assets admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));
