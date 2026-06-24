create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, token)
);
alter table public.push_tokens enable row level security;
create policy "Users manage own tokens" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
