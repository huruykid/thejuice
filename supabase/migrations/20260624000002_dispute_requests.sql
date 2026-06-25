-- NOTE: This file's ORIGINAL version shipped a broken admin RLS policy that
-- referenced a non-existent `profiles.role` column, and it was never applied to
-- prod under this version. The dispute_requests table was created in prod on
-- 2026-06-24 via the consolidated, corrected migration `create_dispute_requests`
-- (and least-privilege grants in `least_privilege_new_tables`).
--
-- This file has been rewritten to be CORRECT and IDEMPOTENT so it can never error
-- on `supabase db push`. It is effectively a no-op against prod (everything already
-- exists). Proper end state: `supabase migration repair --status applied 20260624000002`.

create table if not exists public.dispute_requests (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete set null,
  subject_name text not null,
  contact_email text not null,
  reason text not null,
  additional_info text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);
alter table public.dispute_requests enable row level security;

drop policy if exists "Anyone can submit dispute" on public.dispute_requests;
create policy "Anyone can submit dispute" on public.dispute_requests
  for insert with check (true);

-- Corrected admin RLS (uses current_user_has_role, not the non-existent profiles.role).
drop policy if exists "Admins can view disputes" on public.dispute_requests;
create policy "Admins can view disputes" on public.dispute_requests
  for select using (current_user_has_role('admin'::app_role));

drop policy if exists "Admins can update disputes" on public.dispute_requests;
create policy "Admins can update disputes" on public.dispute_requests
  for update using (current_user_has_role('admin'::app_role))
  with check (current_user_has_role('admin'::app_role));

grant insert on public.dispute_requests to anon;
grant select, insert, update on public.dispute_requests to authenticated;
revoke select, delete, update, truncate, trigger, references on public.dispute_requests from anon;