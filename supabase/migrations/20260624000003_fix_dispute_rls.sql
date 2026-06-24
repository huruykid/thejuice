-- Fix broken admin RLS policies on dispute_requests.
-- The original migration used profiles.role and profiles.id which don't exist;
-- the correct pattern is current_user_has_role('admin'::app_role).

drop policy if exists "Admins can view disputes" on public.dispute_requests;
drop policy if exists "Admins can update disputes" on public.dispute_requests;

create policy "Admins can view disputes" on public.dispute_requests
  for select using (current_user_has_role('admin'::app_role));

create policy "Admins can update disputes" on public.dispute_requests
  for update using (current_user_has_role('admin'::app_role))
  with check (current_user_has_role('admin'::app_role));
