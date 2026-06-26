# Juice — Search-First, Person-as-Unit Redesign Spec

_Product + design + data-model spec. Prepared 2026-06-25. Goal: convert a curious visitor into a verified, posting member by leading with the name-search magic moment, while keeping the verified-only moat and the removal/safety posture intact._

## Cross-functional verdict
- **Growth / Design:** strong yes — value-first, search-led; fixes the "friction before value" funnel.
- **Trust & Safety / Counsel:** yes, conditional — locked-preview keeps unverified users out of real content; person-as-dossier raises takedown stakes, so removal must nuke the whole person page and moderation must be staffed.
- **Founder-operator:** right direction, but validate demand before the full schema rebuild. Phase it.

## The model (one change underneath everything)
**The atomic unit is the PERSON, not the story.** One real person = one page ("post"). Each man's experience stacks underneath as a **review** (what the user called "comments under the post"). Search a name → land on her page → read the stack.

## Access model (value-proof free, reading gated)
- **Unverified can:** search; see that results *exist* (counts, blurred preview); browse the **seed (fictional) feed** as a taste.
- **Unverified cannot:** read real reviews of real people, or post.
- **Verification unlocks:** reading real content + posting. This is already enforced by RLS (seed posts visible to any signed-in user; real posts only to verified) — so the access split is mostly a UI job, not a new security hole.

## Screens & states

### 1. Search-led home (unverified)
- **Hero = search bar.** Placeholder: "Look someone up."
- Below: a taste feed of seed people (avatar, name, flag verdict, review count, snippet).
- **Search HIT (real person):** locked person-card — "Jess M. · 4 reviews · mostly 🚩", review text blurred. CTA: **"Verify to read."**
- **Search MISS (no reviews yet):** "No tea on her yet." CTA: **"Verify to be the first."** — the highest-intent posting moment; the searcher already has a specific person in mind.
- One primary action throughout: search → verify.

### 2. Person page (the new core object)
- Header: avatar, name, **aggregate verdict** ("Mostly red flags · 4 reviews") + averaged 4-axis ratings (communication / loyalty / vibe / respect).
- Body: the **stack of reviews** — each an anonymous codename + their take + their flag + ratings, newest first.
- Unverified view: top review blurred + "Verify to read all 4."
- Verified view: full stack + **"Add your experience"** + report/remove on the page and each review.

### 3. Rescued "pending" state
- Replace the dead spinner with the seed taste feed + locked previews: "You're in line — usually reviewed within a few hours. Here's what's inside."

### 4. Add-a-review (verified, one screen)
Pick/confirm the person (search, or add new) → your take + 4 flags + green/red → submit. Lands on her page.

## Data-model change (the real work)
Today: `stories` = one row per story with `subject_name`/`subject_phone_hash` on each; `comments` attach to stories.

Proposed:
- **`subjects`** (one row per reviewed person): `id`, `display_name`, `name_normalized` (for dedup/match), `subject_phone_hash` (nullable), `photo_path`, `review_count`, cached flag tally + avg ratings, `status` (active/removed), `created_at`, search vector.
- **`reviews`** (the individual experiences — essentially today's `stories`, re-pointed): `id`, `subject_id` (FK), `author_user_id`/`profile_id`, `content`, four ratings, `flag` (red/green), optional `image`, `status` (pending/approved/rejected), `is_seed`, `created_at`.
- **Dedup on add:** match an existing subject by `name_normalized` + `phone_hash`; only create a new subject if no match.
- **Removal:** `dispute_requests` re-points to `subject_id`; approving a dispute removes the **subject and all its reviews** (one action nukes the dossier).
- **Migration:** create `subjects`; collapse distinct `subject_name`(+phone_hash) in `stories` into subjects; link each story → review with `subject_id`.

## Phased plan (validate cheap, then build)

**Phase 0 — Validate the hook (days, no schema change).**
On the *current* model: make search the home hero; group existing stories by `subject_name` in the UI (client-side or a read view); ship the HIT/MISS locked-preview states and the rescued pending screen. Measure: does verify-conversion and first-post rate move? This tells you if the direction works before you invest in the rebuild.

**Phase 1 — Build the real thing (after Phase 0 signal).**
`subjects` + `reviews` schema + migration; the true person page; add-review flow; dispute→subject removal. Wire RLS so unverified see seeds + locked previews only.

**Always-on guardrail:** a staffed moderation routine + the one-tap removal that nukes a whole person page. Per counsel, do not scale traffic until this exists.

## Open decisions for the founder
- Phase 0 first (recommended), or go straight to the schema rebuild?
- Photo on the subject (one canonical photo per person) vs per-review — recommend canonical on the subject.
- How aggressive the "blur" is on locked previews (show snippet vs fully hidden) — a conversion-vs-restraint tradeoff.
