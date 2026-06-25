-- NOTE: Applied to prod on 2026-06-24 via the consolidated migration
-- `create_push_tokens` (not under this version). Rewritten here to be IDEMPOTENT so a
-- stray `supabase db push` cannot error (policy guarded with DROP IF EXISTS).
-- Proper end state: `supabase migration repair --status applied 20260624000001`.

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

drop policy if exists "Users manage own tokens" on public.push_tokens;
create policy "Users manage own tokens" on public.push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_tokens to authenticated;
revoke all on public.push_tokens from anon;