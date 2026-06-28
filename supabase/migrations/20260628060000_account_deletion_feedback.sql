-- Captures why people delete their accounts. Deliberately standalone (no FK to auth.users)
-- so the feedback survives the account's cascade-delete. Stores NO PII — just the reason,
-- optional detail, and how long after signup they left (to spot instant-bounce vs considered).
create table if not exists public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  reason text,
  detail text,
  seconds_since_signup integer,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_feedback enable row level security;

-- Admins read it; inserts come from the service-role delete-account function (bypasses RLS).
drop policy if exists "admin read deletion feedback" on public.account_deletion_feedback;
create policy "admin read deletion feedback" on public.account_deletion_feedback
  for select using (public.has_role(auth.uid(), 'admin'));
