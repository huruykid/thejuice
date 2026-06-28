-- Bugfix: admin landing-photo uploads failed with "new row violates row-level security policy".
--
-- ACTUAL root cause (found by reproducing the request in the browser with a valid admin JWT):
-- the LandingPhotosUploader uploads with upsert:true, and Storage runs a SELECT (existence
-- check) on storage.objects before an upsert. The landing-assets bucket had insert/update/delete
-- policies but NO select policy, so that check failed and surfaced as the misleading
-- "violates row-level security policy" error. (The admin predicate was never the problem — a
-- plain insert without upsert always worked.)
--
-- Fix: keep writes gated on the admin uid (Juice has exactly one admin) and ADD a select policy
-- so the upsert existence check passes. landing-assets is a public bucket (images render for
-- logged-out visitors), so a bucket-scoped select policy is not a data exposure.

drop policy if exists "landing-assets admin insert" on storage.objects;
drop policy if exists "landing-assets admin update" on storage.objects;
drop policy if exists "landing-assets admin delete" on storage.objects;
drop policy if exists "landing-assets read" on storage.objects;

create policy "landing-assets admin insert" on storage.objects
  for insert with check (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid);

create policy "landing-assets admin update" on storage.objects
  for update using (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid)
  with check (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid);

create policy "landing-assets admin delete" on storage.objects
  for delete using (bucket_id = 'landing-assets' and auth.uid() = 'd8936f3d-4770-4e83-be22-ed3b269fa9ed'::uuid);

-- The missing piece: upsert needs a readable existence check.
create policy "landing-assets read" on storage.objects
  for select using (bucket_id = 'landing-assets');
