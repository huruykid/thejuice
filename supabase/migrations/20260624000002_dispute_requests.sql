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
create policy "Anyone can submit dispute" on public.dispute_requests
  for insert with check (true);
create policy "Admins can view disputes" on public.dispute_requests
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
create policy "Admins can update disputes" on public.dispute_requests
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
