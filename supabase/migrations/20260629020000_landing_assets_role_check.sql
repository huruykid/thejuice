-- Security hardening: replace the hardcoded admin-uid checks on the landing-assets bucket
-- with a proper role check. The uid hack was only needed because upsert was failing on a
-- missing SELECT policy; that SELECT policy now exists ("landing-assets read"), so
-- current_user_has_role works across the insert/update/existence-check (upsert) path.
drop policy if exists "landing-assets admin insert" on storage.objects;
drop policy if exists "landing-assets admin update" on storage.objects;
drop policy if exists "landing-assets admin delete" on storage.objects;

create policy "landing-assets admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));

create policy "landing-assets admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role))
  with check (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));

create policy "landing-assets admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'landing-assets' and public.current_user_has_role('admin'::app_role));
