-- Bugfix: admin landing-photo uploads were rejected with "new row violates row-level
-- security policy for table objects".
--
-- We first tried has_role(auth.uid(),'admin') then current_user_has_role('admin') in the
-- storage.objects WITH CHECK; both proved unreliable inside the storage INSERT path. Since
-- Juice has exactly one admin, gate the landing-assets policies directly on the admin's uid.
-- This removes every function/lookup from the check — the only thing that has to be true is
-- that the upload request carries the admin's session.

drop policy if exists "landing-assets admin insert" on storage.objects;
create policy "landing-assets admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid);

drop policy if exists "landing-assets admin update" on storage.objects;
create policy "landing-assets admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid)
  with check (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid);

drop policy if exists "landing-assets admin delete" on storage.objects;
create policy "landing-assets admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid);
