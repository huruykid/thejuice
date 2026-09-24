-- Growth experimentation system, round 1. Applied to prod 2026-09-24.
--
-- Why: 30-day baseline (2026-08-25 → 09-24) is ~150 visitors/wk, ~12 signups/wk, ~400 name
-- searches/wk that MISS, ~10 composer opens/wk and <1 real post/wk (32 people opened the
-- composer since Aug 24; 2 posted). The 45-day goal is 10 genuine posts. Everything here
-- exists to (a) measure the funnel week over week against targets and (b) run the first
-- round of experiments behind server-side switches so a losing one is turned off without
-- a deploy. See GROWTH_EXPERIMENTS.md for hypotheses, targets and the readout cadence.
--
--  1. growth_experiments  — registry + kill switch (admin writes; members read keys only).
--  2. search_alerts       — "tell me when someone posts about her" (opt-in on a miss).
--  3. subject_search_interest(q) — honest social proof: how many OTHER members looked up
--     this exact name in the last 30 days (never who; never seeded; hidden below 2).
--  4. get_search_alert_matches() — service-role feed for the alert email.
--  5. growth_weekly_funnel(weeks) — admin-only weekly funnel for /admin/growth.

-- ─── 1. Experiment registry ────────────────────────────────────────────────────────────
create table if not exists public.growth_experiments (
  key            text primary key,
  name           text not null,
  hypothesis     text not null,
  primary_metric text not null,
  target         text not null,
  status         text not null default 'running'
                 check (status in ('planned','running','paused','won','lost','kept')),
  enabled        boolean not null default true,
  started_at     timestamptz not null default now(),
  ended_at       timestamptz,
  result_notes   text,
  updated_at     timestamptz not null default now()
);
comment on table public.growth_experiments is
  'Growth experiment registry + kill switches. enabled=false turns the mechanic off client-side without a deploy.';

alter table public.growth_experiments enable row level security;

drop policy if exists "Admins manage experiments" on public.growth_experiments;
create policy "Admins manage experiments"
  on public.growth_experiments for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Members never read the table; they get the enabled keys through this RPC so the
-- hypotheses/notes stay internal.
create or replace function public.active_experiment_keys()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(key order by key), '{}')
  from public.growth_experiments
  where enabled and status in ('running','kept');
$$;
revoke all on function public.active_experiment_keys() from public, anon;
grant execute on function public.active_experiment_keys() to authenticated, service_role;

insert into public.growth_experiments (key, name, hypothesis, primary_metric, target) values
  ('miss_interest',
   'Search-miss social proof',
   'Showing "N other members looked her up this month" on a miss raises the miss → composer-open rate, because it proves the demand is real and the poster will be read.',
   'search_miss → review_started (prefilled) rate', '2.5% → 5% (weekly, ≥100 misses)'),
  ('search_alerts',
   'Search alerts on a miss',
   'A one-tap "alert me when someone posts about her" converts a dead-end miss into a re-engagement contract; alert holders return at ≥3× the W1 baseline (10%).',
   'alerts per miss; W1 return of alert creators', '≥15% of misses create an alert; ≥30% W1 return'),
  ('miss_share',
   'Ask-the-group-chat share on a miss',
   'Men already ask their friends about a girl; a share link on the miss turns that habit into referral traffic.',
   'share_clicked per miss; ref-attributed signups', '≥5% of misses share; ≥2 ref signups/wk'),
  ('composer_ladder',
   'Composer: quick-fill chips + saved draft + abandonment logging',
   'The composer is the leak (6% of opens publish). Tap-to-fill phrases lower the writing cost, a saved draft survives the photo-picker detour, and logging what was empty at abandon tells us which required field kills it.',
   'review_started → post_created', '6% → 15%'),
  ('post_share',
   'Post-publish share + referral link',
   'The moment after publishing is peak pride; a one-tap share with a personal ref link brings the next member in.',
   'share_clicked per post; ref signups', '≥30% of posters share; k-factor tracked'),
  ('attribution',
   'Capture ?ref / utm on signup',
   'We cannot pick a channel to double down on without attribution (referral_source is answered by <2% of members).',
   'share of signups with a known source', '≥40% of signups attributed')
on conflict (key) do nothing;

-- ─── 2. Search alerts ──────────────────────────────────────────────────────────────────
create table if not exists public.search_alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  subject_name text not null check (btrim(subject_name) <> '' and length(subject_name) <= 120),
  norm_name    text generated always as (lower(btrim(subject_name))) stored,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz,
  story_id     uuid references public.stories(id) on delete set null,
  unique (user_id, norm_name)
);
comment on table public.search_alerts is
  'Member opted in on a search miss to hear when a story about that name goes live. Emailed once by search-alert-notify.';
create index if not exists search_alerts_pending_idx on public.search_alerts (norm_name) where notified_at is null;

alter table public.search_alerts enable row level security;

drop policy if exists "Users manage own search alerts" on public.search_alerts;
create policy "Users manage own search alerts"
  on public.search_alerts for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── 3. Honest social proof for a miss ─────────────────────────────────────────────────
-- Distinct OTHER members who searched this exact (normalized) name in the last 30 days,
-- plus how many are holding an alert for it. Returns zeros below 2 searchers so a single
-- stalker-ish search never becomes "1 other guy looked her up". Seeded/system rows are
-- excluded by definition (analytics_events only holds member actions).
create or replace function public.subject_search_interest(q text)
returns table (searchers int, alerts int)
language sql
stable
security definer
set search_path = public
as $$
  with n as (select lower(btrim(q)) as norm),
  s as (
    select count(distinct e.user_id)::int as c
    from public.analytics_events e, n
    where e.event in ('search_miss','search_hit')
      and e.user_id <> auth.uid()
      and e.created_at > now() - interval '30 days'
      and lower(btrim(e.props->>'name')) = n.norm
  ),
  a as (
    select count(*)::int as c
    from public.search_alerts sa, n
    where sa.norm_name = n.norm and sa.user_id <> auth.uid() and sa.notified_at is null
  )
  select case when s.c >= 2 then s.c else 0 end, a.c from s, a;
$$;
revoke all on function public.subject_search_interest(text) from public, anon;
grant execute on function public.subject_search_interest(text) to authenticated;

-- ─── 4. Alert matches (service role only — feeds the email) ───────────────────────────
create or replace function public.get_search_alert_matches(max_rows int default 200)
returns table (alert_id uuid, user_id uuid, subject_name text, story_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (sa.id) sa.id, sa.user_id, sa.subject_name, s.id
  from public.search_alerts sa
  join public.stories s
    on s.status = 'approved'
   and s.subject_name is not null
   and lower(btrim(s.subject_name)) = sa.norm_name
   and s.created_at >= sa.created_at - interval '1 hour'
  where sa.notified_at is null
    and not exists (select 1 from public.email_optouts eo where eo.user_id = sa.user_id)
  order by sa.id, s.created_at asc
  limit max_rows;
$$;
revoke all on function public.get_search_alert_matches(int) from public, anon, authenticated;
grant execute on function public.get_search_alert_matches(int) to service_role;

-- ─── 5. Weekly growth funnel (admin) ───────────────────────────────────────────────────
-- One row per ISO week, newest first. Everything is derived from tables we already keep;
-- nothing here is estimated. Visitor counts live in Lovable/GA and are entered by hand
-- in GROWTH_EXPERIMENTS.md.
create or replace function public.growth_weekly_funnel(weeks int default 8)
returns table (
  week               date,
  signups            int,
  attributed_signups int,
  ref_signups        int,
  verif_submitted    int,
  verif_approved     int,
  active_users       int,
  searchers          int,
  search_hits        int,
  search_misses      int,
  alerts_created     int,
  composer_opens     int,
  composer_openers   int,
  composer_abandons  int,
  posts_submitted    int,
  posts_approved     int,
  posters            int,
  shares             int,
  w1_returned        int,
  median_hours_signup_to_post numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with bounds as (
    select date_trunc('week', now())::date - (weeks - 1) * interval '7 days' as start_wk
  ),
  wk as (
    select generate_series(
      (select start_wk from bounds),
      date_trunc('week', now())::date,
      interval '7 days'
    )::date as week
  ),
  ev as (
    select date_trunc('week', created_at)::date as week, user_id, event, props, created_at
    from public.analytics_events
    where created_at >= (select start_wk from bounds)
  ),
  prof as (
    select date_trunc('week', created_at)::date as week, user_id, created_at
    from public.profiles
    where created_at >= (select start_wk from bounds)
  ),
  first_post as (
    select user_id, min(created_at) as t from public.analytics_events
    where event = 'post_created' group by 1
  ),
  cohort_return as (
    -- W1 return by signup week: opened the app 1–7 days after profile creation.
    select p.week, count(distinct p.user_id) as returned
    from prof p
    join public.analytics_events e
      on e.user_id = p.user_id and e.event = 'app_open'
     and e.created_at >  p.created_at + interval '1 day'
     and e.created_at <= p.created_at + interval '7 days'
    group by 1
  ),
  ttp as (
    select p.week,
           percentile_cont(0.5) within group (order by extract(epoch from (fp.t - p.created_at)) / 3600) as med_h
    from prof p join first_post fp on fp.user_id = p.user_id
    group by 1
  )
  select
    w.week,
    (select count(*)::int from prof p where p.week = w.week),
    (select count(distinct e.user_id)::int from ev e where e.week = w.week and e.event = 'signup'
       and (e.props->>'ref' is not null or e.props->>'utm_source' is not null or e.props->>'referrer_host' is not null)),
    (select count(distinct e.user_id)::int from ev e where e.week = w.week and e.event = 'signup' and e.props->>'ref' is not null),
    (select count(*)::int from public.user_verifications v where date_trunc('week', v.created_at)::date = w.week),
    (select count(*)::int from public.user_verifications v where date_trunc('week', v.updated_at)::date = w.week and v.verification_status = 'approved'),
    (select count(distinct e.user_id)::int from ev e where e.week = w.week and e.event = 'app_open'),
    (select count(distinct e.user_id)::int from ev e where e.week = w.week and e.event in ('search_hit','search_miss')),
    (select count(*)::int from ev e where e.week = w.week and e.event = 'search_hit'),
    (select count(*)::int from ev e where e.week = w.week and e.event = 'search_miss'),
    (select count(*)::int from public.search_alerts sa where date_trunc('week', sa.created_at)::date = w.week),
    (select count(*)::int from ev e where e.week = w.week and e.event = 'review_started'),
    (select count(distinct e.user_id)::int from ev e where e.week = w.week and e.event = 'review_started'),
    (select count(*)::int from ev e where e.week = w.week and e.event = 'composer_abandoned'),
    (select count(*)::int from public.stories s where date_trunc('week', s.created_at)::date = w.week and coalesce(s.is_seed,false) = false and s.user_id is not null),
    (select count(*)::int from public.stories s where date_trunc('week', s.created_at)::date = w.week and coalesce(s.is_seed,false) = false and s.user_id is not null and s.status = 'approved'),
    (select count(distinct s.user_id)::int from public.stories s where date_trunc('week', s.created_at)::date = w.week and coalesce(s.is_seed,false) = false and s.user_id is not null),
    (select count(*)::int from ev e where e.week = w.week and e.event = 'share_clicked'),
    coalesce((select returned::int from cohort_return c where c.week = w.week), 0),
    (select round(med_h::numeric, 1) from ttp t where t.week = w.week)
  from wk w
  where public.has_role(auth.uid(), 'admin')
  order by w.week desc;
$$;
revoke all on function public.growth_weekly_funnel(int) from public, anon;
grant execute on function public.growth_weekly_funnel(int) to authenticated, service_role;

-- Composer abandonment breakdown: which required field was still empty when people gave
-- up. This is the single most useful number for the composer_ladder experiment.
create or replace function public.growth_composer_abandon_reasons(days int default 30)
returns table (missing text, abandons int)
language sql
stable
security definer
set search_path = public
as $$
  select m.missing, count(*)::int
  from public.analytics_events e
  cross join lateral jsonb_array_elements_text(coalesce(e.props->'missing', '[]'::jsonb)) as m(missing)
  where e.event = 'composer_abandoned'
    and e.created_at > now() - (days || ' days')::interval
    and public.has_role(auth.uid(), 'admin')
  group by 1
  order by 2 desc;
$$;
revoke all on function public.growth_composer_abandon_reasons(int) from public, anon;
grant execute on function public.growth_composer_abandon_reasons(int) to authenticated, service_role;

-- ─── 6. Hourly search-alert notifier ───────────────────────────────────────────────────
-- Same pg_cron + pg_net + vault-secret pattern as daily-search-miss-nudge.
select cron.unschedule('hourly-search-alert-notify')
where exists (select 1 from cron.job where jobname = 'hourly-search-alert-notify');
select cron.schedule(
  'hourly-search-alert-notify',
  '15 * * * *',
  $$
  select net.http_post(
    url := 'https://mccehajzdnpkpusffhco.supabase.co/functions/v1/search-alert-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-nudge-secret', (select decrypted_secret from vault.decrypted_secrets where name='nudge_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
