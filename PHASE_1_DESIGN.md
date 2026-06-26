# Phase 1 Design — Person-as-Unit Rebuild (execution-ready, not yet built)

**Status:** Design only. No code changed. Gated on Phase 0 validation (search loop works +
W1 return trending up). When that signal lands, this doc is the build order.

**Goal:** Make a *person* the unit of the app, not a story. One person = one page; individual
stories stack underneath like comments. Search lands on the person; reading and adding a
review both happen on the person page.

This is written as an **expand / migrate / contract** sequence so nothing breaks mid-flight:
every step is additive and reversible until the very end.

---

## 1. Current state (grounded in prod schema)

- `stories` is the only content unit. A person is just free text in `stories.subject_name`
  (nullable) plus `subject_phone` / `subject_phone_hash`. There is **no** person entity.
- Ratings live per story: `communication_rating`, `loyalty_rating`,
  `emotional_safety_rating`, `overall_vibe_rating` (all 0–5, nullable).
- `dispute_requests` targets a person by `subject_name` text (+ optional `story_id`).
- `comments`, `reactions`, `story_tags` all hang off `story_id`.
- Phase 0 added `search_subject_preview(q)` which *groups* `stories` by `subject_name` at query
  time — a stopgap that proves the UX without a real person entity.

The core problem this fixes: "subject" is a string, so the same person typed two ways is two
different people, aggregates are recomputed on every search, and there's nothing to link a
dispute, a page, or a verdict to.

---

## 2. Target data model

### New table: `subjects` (the person)

```sql
create table public.subjects (
  id               uuid primary key default gen_random_uuid(),
  display_name     text not null,                 -- canonical name shown on the page
  normalized_name  text not null,                 -- lower(unaccent(trim(display_name))) for matching
  phone_hash       text,                          -- strongest identity signal when present
  slug             text unique,                   -- for /person/:slug URLs
  review_count     int  not null default 0,
  avg_communication numeric(3,2),
  avg_loyalty       numeric(3,2),
  avg_emotional_safety numeric(3,2),
  avg_vibe          numeric(3,2),
  is_seed          boolean not null default false,
  is_removed       boolean not null default false, -- dispute/takedown kills the whole person
  first_review_at  timestamptz,
  last_review_at   timestamptz,
  created_at       timestamptz not null default now()
);
create unique index subjects_identity_idx on public.subjects (normalized_name, coalesce(phone_hash,''));
create index subjects_normalized_idx on public.subjects (normalized_name);
create index subjects_phone_hash_idx on public.subjects (phone_hash) where phone_hash is not null;
```

**Identity / dedup rule (the hard part):** a story matches an existing subject when
`phone_hash` matches (strongest), OR `normalized_name` matches and no conflicting phone. If no
match, create a new subject. Keep it deterministic and server-side (see trigger below). Fuzzy
matching (nicknames, typos) is explicitly **out of scope for v1** — start strict, add a
human "merge subjects" admin tool later rather than guessing.

### Change to `stories` (becomes a *review of* a subject)

```sql
alter table public.stories
  add column subject_id uuid references public.subjects(id) on delete set null;
create index stories_subject_id_idx on public.stories (subject_id);
```

Keep the table name `stories` and keep `subject_name` for now (cheap rollback, and it's the
backfill source). Conceptually a row is now "a review under a subject."

### Change to `dispute_requests`

```sql
alter table public.dispute_requests
  add column subject_id uuid references public.subjects(id) on delete set null;
```

Disputes can now target the whole person, which is what removal actually needs.

---

## 3. Migration sequence (each step ships + is verified before the next)

**Step 1 — Expand (additive, zero user-visible change).**
Create `subjects`, add `stories.subject_id` + `dispute_requests.subject_id`. Apply via the
Supabase connector (for prod parity) **and** commit the repo migration file, same as we've
been doing.

**Step 2 — Backfill.** One-time: for each distinct non-null `subject_name`, create a subject
(carry `phone_hash`, `is_seed = bool_or(is_seed)`), then set `stories.subject_id`. Compute the
aggregate columns. Idempotent (guard with `on conflict do nothing` on the identity index).

```sql
-- sketch; finalize with normalization fn before running
insert into public.subjects (display_name, normalized_name, phone_hash, is_seed)
select distinct on (lower(btrim(subject_name)), coalesce(subject_phone_hash,''))
       subject_name, lower(btrim(subject_name)), subject_phone_hash, false
from public.stories
where subject_name is not null and btrim(subject_name) <> ''
on conflict (normalized_name, coalesce(phone_hash,'')) do nothing;

update public.stories s set subject_id = sub.id
from public.subjects sub
where s.subject_name is not null
  and lower(btrim(s.subject_name)) = sub.normalized_name
  and coalesce(s.subject_phone_hash,'') = coalesce(sub.phone_hash,'');
```

**Step 3 — Maintain via trigger.** `AFTER INSERT/UPDATE/DELETE` on `stories`: upsert the
subject (match by identity rule), recompute `review_count` + the four averages +
`first/last_review_at` for the affected subject. This replaces query-time grouping. Only count
`status = 'approved'` rows in aggregates. Makes `search_subject_preview` a simple indexed read.

**Step 4 — Migrate reads (frontend, behind nothing — it's strictly better).**
- Rewrite `search_subject_preview` to read `subjects` directly and return `subject_id` + `slug`.
- New **person page** `/person/:slug` (see §4).
- Search results link to the person page instead of being inert cards.

**Step 5 — Migrate writes: add-review flow (§5).**

**Step 6 — Dispute → removal (§6).**

**Step 7 — Contract (later, optional).** Once everything reads `subject_id`, demote
`subject_name` to a denormalized convenience column or drop it. Do this only after a couple
weeks of stability.

---

## 4. Person page (`/person/:slug`)

- **Header:** name, aggregate verdict chip (from `avg_vibe`: ≤2.5 mostly red / ≥3.5 mostly
  green / mixed), the four rating bars, `review_count`, location spread.
- **Body:** reviews stacked newest-first (the existing `StoryCard`, minus the redundant name).
- **Gating stays:** unverified users hitting `/person/:slug` get the locked-preview treatment
  (counts + verdict, seed text only) — reuse the Phase 0 `SubjectSearch` lock pattern. Reading
  real reviews stays RLS-gated; do not relax this.
- **Primary CTA:** "Add your review" → §5, pre-bound to this subject.
- `is_removed = true` → 404/"This page is no longer available" for everyone.

## 5. Add-review flow

Reuse `useCreateStory` + `CreateStory`, with one change: the person step resolves to a subject.

- Entry A (from a person page): subject is known → skip the name step, attach `subject_id`.
- Entry B (from search miss / "be the first"): collect name (+ optional phone) → on submit, the
  Step-3 trigger creates/matches the subject automatically. No client-side subject creation —
  let the trigger own identity so the rule lives in one place.
- After submit, route to that person page so the user sees their review land in context.

## 6. Dispute → subject removal

- `DisputeRequest` form resolves the named person to a `subject_id` (search-as-you-type against
  `subjects`) so admins act on an entity, not a string.
- Admin queue (`AdminDisputes`) gains a **"Remove person"** action: set
  `subjects.is_removed = true` and cascade-hide its reviews (`stories.status = 'removed'` or a
  `is_hidden` flag — pick one; `status` already exists, add a `'removed'` value). Page 404s,
  search excludes `is_removed`, aggregates skip removed reviews.
- Keep per-review removal too (existing flow) for partial takedowns.
- **Legal note:** removal must be genuinely effective (no orphaned cached content). This ties
  to the still-open legal items in `LEGAL_COUNSEL_CHECKLIST.md` — confirm the takedown SLA and
  that `is_removed` is enforced on every read path before relying on it.

---

## 7. RLS summary (least-privilege, consistent with current model)

- `subjects`: SELECT for `authenticated` where `is_removed = false` (verified-user reading of
  *reviews* still gated at `stories`); previews for unverified go through the SECURITY DEFINER
  search RPC only. No direct client INSERT/UPDATE — subjects are trigger-owned.
- `stories.subject_id`: no new policy needed; inherits existing story RLS.
- `dispute_requests.subject_id`: inherits existing dispute policies.
- Admin-only: the "remove person" mutation goes through a SECURITY DEFINER fn gated by
  `has_role(auth.uid(),'admin')`, not a broad table grant.

---

## 8. Risks & call-outs

- **Identity collisions / merges** are the real complexity. Ship strict matching + a manual
  admin merge tool; do **not** auto-fuzzy-match real people (wrong merge = defaming the wrong
  person — a legal problem, not just a bug).
- **Backfill correctness:** verify counts before/after (`select count(distinct subject_name)`
  vs `select count(*) from subjects`) and spot-check a few people.
- **Don't rename `stories`** in v1 — a table rename touches ~20 files (hooks, RLS, triggers,
  types) for zero user value. Rename later if ever.
- **This is multiple commits, not one.** Steps 1–3 are DB (apply via connector + repo
  migration, no Publish). Steps 4–6 are frontend (need Publish). Ship and verify each before
  the next.

---

## 9. Build order checklist

1. [ ] Step 1 expand migration (subjects + FKs) — connector + repo file
2. [ ] Step 2 backfill + verify counts
3. [ ] Step 3 maintenance trigger (aggregates) + retire query-time grouping
4. [ ] Step 4 search RPC v2 + person page + link search results
5. [ ] Step 5 add-review flow bound to subject
6. [ ] Step 6 dispute resolves to subject + admin "remove person"
7. [ ] Step 7 (later) contract `subject_name`
