# Activation & Retention Metrics (Phase 0)

We now log four events to `public.analytics_events` (append-only; users insert their own,
admins read). Events: `signup`, `verification_submitted`, `post_created`, `app_open`
(`app_open` is de-duped to once per browser session).

**STATUS 2026-08-26 — funnel instrumented end to end.** Added `search_hit`, `search_miss`,
`review_started` (composer opened; `props.prefilled` = came from a search miss) and
`verification_approved` (client-side, first time the browser sees the account approved).
Every event is also mirrored to Google Analytics (`src/lib/analytics.ts`) as
`sign_up`, `search` (`result: hit|miss` — **never** the name), `verification_submitted`,
`verification_approved`, `review_started`, `review_submitted`. Mark `review_submitted` as
a **key event** in GA Admin → Events; that is the conversion. Before this, GA had only
automatic events and the funnel existed nowhere but this table.

## 0. Search miss rate (does content growth close the gap?)

```sql
select date_trunc('week', created_at) as week,
       count(*) filter (where event = 'search_hit')  as hits,
       count(*) filter (where event = 'search_miss') as misses,
       round(100.0 * count(*) filter (where event = 'search_miss')
             / nullif(count(*) filter (where event in ('search_hit','search_miss')), 0), 1)
         as miss_pct,
       count(*) filter (where event = 'review_started' and (props->>'prefilled')::boolean)
         as misses_turned_into_composer_opens
from public.analytics_events
group by 1
order by 1 desc;
```

> Note: events are **forward-looking** — they start accumulating from the deploy date
> (2026-06-26). Cohort/return numbers only become meaningful once a week of data exists.
> Run these in the Supabase SQL editor (admin).

## 1. Real posts per week (the core supply metric)

Derived straight from `stories` (excludes seed content):

```sql
select date_trunc('week', created_at) as week,
       count(*)                                  as submitted,
       count(*) filter (where status = 'approved') as approved
from public.stories
where coalesce(is_seed, false) = false
group by 1
order by 1 desc;
```

## 2. Activation funnel (signup → verify → post)

```sql
select
  count(distinct user_id) filter (where event = 'signup')                 as signups,
  count(distinct user_id) filter (where event = 'verification_submitted') as submitted_verification,
  count(distinct user_id) filter (where event = 'post_created')           as posted
from public.analytics_events;
```

## 3. Week-1 return rate, by signup cohort

A user "returns" if they open the app 1–7 days after signing up:

```sql
with signups as (
  select user_id, min(created_at) as signed_up
  from public.analytics_events
  where event = 'signup'
  group by 1
),
returned as (
  select distinct s.user_id
  from signups s
  join public.analytics_events e
    on e.user_id = s.user_id
   and e.event = 'app_open'
   and e.created_at >  s.signed_up + interval '1 day'
   and e.created_at <= s.signed_up + interval '7 days'
)
select date_trunc('week', s.signed_up) as cohort_week,
       count(distinct s.user_id)                                   as signups,
       count(distinct r.user_id)                                   as returned_w1,
       round(100.0 * count(distinct r.user_id)
             / nullif(count(distinct s.user_id), 0), 1)            as w1_return_pct
from signups s
left join returned r on r.user_id = s.user_id
group by 1
order by 1 desc;
```

## 4. Posts per active user per week (engagement depth)

```sql
select date_trunc('week', created_at) as week,
       count(*) filter (where event = 'post_created')          as posts,
       count(distinct user_id) filter (where event='app_open') as active_users
from public.analytics_events
group by 1
order by 1 desc;
```

## North-star to watch
Real **posts/week** (supply) and **W1 return %** (retention). If supply climbs but return
stays flat, the search loop isn't paying off; if return climbs but supply is flat, people
like reading but won't contribute — different fixes.
