-- Public bucket for admin-managed landing/teaser example images. Public read (the landing is
-- logged-out), admin-only write. The founder uploads these himself from the admin side.
insert into storage.buckets (id, name, public)
values ('landing-assets', 'landing-assets', true)
on conflict (id) do nothing;

drop policy if exists "landing-assets admin insert" on storage.objects;
create policy "landing-assets admin insert" on storage.objects
  for insert with check (bucket_id = 'landing-assets' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "landing-assets admin update" on storage.objects;
create policy "landing-assets admin update" on storage.objects
  for update using (bucket_id = 'landing-assets' and public.has_role(auth.uid(), 'admin'));

drop policy if exists "landing-assets admin delete" on storage.objects;
create policy "landing-assets admin delete" on storage.objects
  for delete using (bucket_id = 'landing-assets' and public.has_role(auth.uid(), 'admin'));
