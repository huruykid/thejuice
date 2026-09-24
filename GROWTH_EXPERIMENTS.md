# Growth experiments — the operating system

**Goal (45 days, 2026-09-24 → 2026-11-08): 10 genuine member-created stories.**
The real objective is the loop behind those 10: a repeatable path from 10 → 100 → 1,000.

Readout lives at `/admin/growth`. This file holds the reasoning, the baseline, the
hypotheses, and the log. One cycle = one week. Every cycle ends by answering the six
questions in **§6** and writing them into **§7**.

---

## 1. Baseline (30 days to 2026-09-24)

Source: `analytics_events`, `profiles`, `user_verifications`, `stories`, Lovable analytics.

| Stage | Weekly | Rate | Notes |
|---|---|---|---|
| Visitors (Lovable) | ~150 | — | 655 / 30d; 78% mobile; Direct 54%, Google 10%, DDG/Bing/Yahoo 9%, Facebook 5% |
| Signups (profiles) | ~12 | ~8% of visitors | 350 members lifetime |
| Selfie submitted | ~11 | ~85% of signups | approval ~90%, median wait 11–17 h (was 300+ h in July) |
| Weekly active (app_open) | ~40 | — | 171 in 30d |
| Members who searched | ~35 | 90% of active | **searching is the product** — 153 of 171 active members searched |
| Search misses | **~400** | 96% of searches | 126 members missed on ≥3 different names in 30d |
| Search hits | ~10 | 4% | only 3 real stories exist |
| Composer opens | ~10 | 2.5% of misses | `review_started`, mostly prefilled from a miss |
| **Posts submitted** | **<1** | **6% of opens** | 32 people opened the composer since Aug 24 → 2 posted |
| W1 return | — | ~10% of signups | |
| Referral source known | — | <2% | `referral_source` answered by 6 of 350 |

Email programs to date: search-miss nudge (259 members, ~9% opened the app within 3 days — keep);
founding-member broadcast (419 members, **1** returned — stop sending it as-is).

### Diagnosis
Stage: **SUPPLY**. Demand is proven (400 misses/week, people searching multiple names).
The loop is search → miss → post → next search hits. Two leaks kill it:
1. **The composer** — 6% of opens publish. Required: name, verdict, story, ≥1 photo, honesty ack.
   We don't yet know *which* requirement stops people (fixed this round: `composer_abandoned`).
2. **The miss is a dead end** — nothing captures the intent. The member leaves; nothing brings
   him back when the situation changes.

### Working backward from 10 posts
posts = composer opens × completion. At 10 opens/week × 6% we get ~4 in 45 days.
Targets that reach 10 with margin: **15 opens/week × 15% ≈ 2.2/week ≈ 14 in 6.4 weeks.**
Intermediate checks: **day 15 (Oct 9) ≥ 3 posts · day 30 (Oct 24) ≥ 6 · day 45 (Nov 8) ≥ 10.**
Leading indicators to watch before posts move: composer completion ≥ 10% by day 15;
misses → composer ≥ 4%; alerts created ≥ 40/week.

---

## 2. What we researched (and what we're borrowing)

| Precedent | Evidence | Borrowed as |
|---|---|---|
| **Are We Dating The Same Guy** groups (3.5M members) | The dominant post is an *ask* ("any tea on him?"), not a review | The miss card is the ask; "Ask the group chat" share |
| **Tea** (2025, 2.5M installs/30d) | Verified-only scarcity + 7-second TikTok text-overlay format + waitlist | Round 2: creator-format test |
| **tbh / Gas / Fizz** | One school/metro at a time; polls = zero-writing contribution; ego notifications | Round 2: pick one metro by miss volume; flag-only rung |
| **Glassdoor give-to-get** | Gate unlocks after one contribution; reviews get *more* moderate | Deliberately **not** re-adding a post-to-read gate (killed Aug 26 — it produced 1% posting). Considered for alerts in round 2 |
| **Nextdoor** | Neighborhood goes live only after a founder recruits 9 others | Founding-member badge idea, round 2 |
| **Dropbox / Clubhouse** | Referral placed *after* the value moment; invites as status | Post-publish share with ref link |
| **Airship push data** | Any push ≈ 3× 90-day retention; saved-search alerts are the standard miss-recovery pattern | Search alerts + payoff email |
| **NN/g 90-9-1, Chen 1/10/100** | Expect ~1 creator per 100; lower the first rung | Quick-fill chips; draft persistence |

Rejected: indexed per-name pages (defamation/privacy exposure; conflicts with gated routes),
fabricated seed reviews about real people (hard line), paid "moderators" posting.

---

## 3. Round 1 — shipped 2026-09-24

All behind `growth_experiments.enabled` (toggle at `/admin/growth`; no deploy to turn off).

| Key | Mechanic | Hypothesis | Primary metric | Target | Kill if |
|---|---|---|---|---|---|
| `miss_interest` | "N other members looked her up this month" on a miss (real count, ≥2 only) | Proof of readership raises miss → composer | misses → `review_started` | 2.5% → **5%** | <3% after 2 weeks with ≥200 misses |
| `search_alerts` | "Alert me" on a miss → `search_alerts`; hourly `search-alert-notify` emails the payoff | Turns a dead end into a return contract | alerts / miss; W1 return of alert creators | **≥15%** of misses; **≥30%** W1 return | <5% opt-in after 2 weeks |
| `miss_share` | "Ask the group chat" share with ref link | Existing habit → referral traffic | `share_clicked`(miss) / miss; ref signups | ≥5%; ≥2 ref signups/wk | <1% share rate after 2 weeks |
| `composer_ladder` | Quick-fill chips, session draft, `composer_abandoned` logging | Lower the writing cost; survive the photo detour; learn which field kills it | `review_started` → `post_created` | 6% → **15%** | never — the logging is the point; chips can go if completion doesn't move by day 30 |
| `post_share` | Success screen stays up with "Send Juice to the group chat" + ref link | Peak-pride moment → next member | share / post; ref signups | ≥30% of posters share | <10% after 10 posts |
| `attribution` | `?ref`, `utm_*`, referrer host captured at first touch, attached to `signup` | Can't pick a channel without it | attributed share of signups | ≥40% | never |

Also fixed: `verification_submitted` never fired (wrong hook) — selfie funnel is now measurable.

Not shipped (deliberately): removing the photo requirement (founder's call — measure first),
a post-to-read gate (proven harmful here), TikTok creator spend (needs the loop to hold first).

---

## 4. Metrics dictionary

| Metric | Definition | Where |
|---|---|---|
| Signup conversion | profiles created / Lovable visitors (weekly) | Lovable + `/admin/growth` |
| Selfie rate | `verif_submitted` / signups | `/admin/growth` |
| % new users who post | posters in cohort / cohort signups (within 14 days) | SQL in ACTIVATION_METRICS.md §2 |
| Time to first post | median hours profile → `post_created` | `/admin/growth` "Median h → post" |
| Story completion | `post_created` / `review_started` | `/admin/growth` "Composer → post" |
| Shares per story | `share_clicked` / posts submitted | `/admin/growth` |
| Referral signups | `signup` events with `props.ref` | `/admin/growth` "Ref signups" |
| Posts per active user | posts / weekly active | `/admin/growth` (posts ÷ active) |
| Returning-user rate | W1 return: `app_open` 1–7 days after signup | `/admin/growth` "W1 return" |
| Alert payoff | `search_alert_emailed` → `app_open` within 3 days | SQL below |

```sql
-- Alert payoff: did the "someone posted about her" email bring them back?
select count(distinct a.user_id) emailed,
       count(distinct o.user_id) returned_3d
from analytics_events a
left join analytics_events o on o.user_id = a.user_id and o.event = 'app_open'
  and o.created_at between a.created_at and a.created_at + interval '3 days'
where a.event = 'search_alert_emailed';

-- Composer abandon reasons (admin): select * from growth_composer_abandon_reasons(30);
-- Weekly funnel (admin):            select * from growth_weekly_funnel(10);
```

---

## 5. Cadence

- **Weekly (Thursday):** pull `/admin/growth`, fill §7 for the week, decide keep/kill/modify per
  the kill criteria above, queue next round. A scheduled Claude task drafts this readout.
- **Day 15 / 30 / 45 checkpoints:** posts ≥ 3 / 6 / 10. Miss a checkpoint → the next round is
  100% supply (recruit founding members by hand in the top-miss metro; no other experiments).
- **Rule:** max 3 new experiments per round. A mechanic becomes permanent (`status='kept'`) only
  after it beats baseline for two consecutive weeks with the minimum denominator.

## 6. Cycle questions (answer every week)

1. What did we test?
2. What happened? (numbers vs. baseline)
3. Did it outperform the baseline?
4. What did we learn?
5. What do we keep, remove, or change?
6. What do we test next?

## 7. Log

### Cycle 0 — 2026-09-24 (launch)
1. **Tested:** nothing yet — round 1 shipped today (§3).
2. **Happened:** baseline established (§1).
3. **Outperformed baseline:** n/a.
4. **Learned:** supply is the constraint; 400 misses/week is the asset; the composer leaks 94% of
   intent; `verification_submitted` and referral attribution were both blind spots; the
   founding-member email doesn't work (1/419).
5. **Keep/remove/change:** keep the search-miss nudge email; stop the founding-member broadcast;
   remove nothing else yet.
6. **Next:** read `composer_abandoned` on Oct 1. If "photo" dominates → make the photo step
   easier (camera-first capture, one-tap from the chip row), not optional. If "story"
   dominates → a flag-only rung (verdict + one chip, no prose) — needs the DB
   `validate_story_content` minimum relaxed.

### Round 2 candidates (pick ≤3 on Oct 1 based on cycle-1 data)
- **One-metro launch:** add the searcher's profile city to `search_miss` props, pick the top
  city, hand-recruit 5 founding members there, seed 20–30 real posts, market only there.
- **Flag-only rung:** verdict + chips, prose optional (DB change).
- **"Your search now has results" weekly digest** for all miss-ers in a city once ≥5 posts exist.
- **Founding-member badge** on the first 10 posters per city (status, not money).
- **7-second creator format** test with one male creator; UTM-tagged.
- **Give-to-get on alerts:** on the 3rd miss, "post one flag to unlock alerts" (Glassdoor-style,
  flag-only minimum) — only if `search_alerts` opt-in is high but posting stays flat.
