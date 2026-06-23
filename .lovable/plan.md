# Post-to-Unlock Revisions

Three focused changes layered on top of the already-implemented post-to-unlock + seed feed system.

## 1. images on posts is essential

add words like allegedly as much as possible while still making the userflow intuitive. 

## 2. Quick green-flag / red-flag rating system

Replace the current 1-5 numeric sliders with a faster, more scannable system.

**How it works for the author:**

- 4 fixed categories (same as today: e.g. Communication, Honesty, Vibe, Red Flags — confirm exact labels in current `MetadataStep`)
- For each category, author taps either a **green flag** or a **red flag** icon, then picks **how many** (1, 2, or 3) to indicate intensity
- No sliders, no 1-5 scale, no neutral middle

**How it renders on the card:**

- Each category shows the chosen color + flag count, e.g. `Communication 🟢🟢🟢` / `Red Flags 🚩🚩`
- Total green vs red count surfaces as an at-a-glance summary at the top of the card

**Preview before selecting:** Each category shows its label and a one-line description inline (e.g. "Communication — how responsive were they?") so the author knows what they're rating before they tap. No tooltips, no hidden helper text.

**Schema:** The current `stories` table stores ratings as integers. We'll reinterpret them:

- Value `-3` to `-1` = red flags (count = abs value)
- Value `+1` to `+3` = green flags
- Value `0` = not rated (hide on card)

This avoids a migration. Existing seed posts get re-written with the new values (see section 3).

## 3. Women-celebrity tabloid seed posts

Replace the current 20 seed posts (mixed gender) with 20 posts about **women celebrities**, framed as **widely-reported public tabloid rumors only** — no invented "guy POV" narratives, no fabricated quotes. Tone: "Here's what's been reported about dating [X]" — TMZ/Page Six level, sourced from public reporting.

**Target list (final 20 TBD during write):** Sydney Sweeney, Hailey Bieber, Sofia Richie, Madison Beer, Kim Kardashian, Kendall Jenner, Bella Hadid, Gigi Hadid, Megan Fox, Olivia Wilde, Dua Lipa, Taylor Swift, Ariana Grande, Selena Gomez, Zendaya, Margot Robbie, Jennifer Lawrence, Emily Ratajkowski, Camila Cabello, Rihanna.

Each seed post:

- Codename = first name + last initial (e.g. "Sydney S.")
- Content = 2-3 paragraphs summarizing public dating rumors/reports, no fabrication
- Green/red flags applied per the new system
- `is_seed = true`, `status = 'approved'`, `submitted_anonymously = false`
- Small "Editorial seed" badge on the card so users know these aren't community posts

## Technical Section

**Files to touch:**

- `src/components/CreateStory/MetadataStep.tsx` — replace sliders with green/red flag toggles + count picker; add inline category descriptions
- `src/components/CreateStory/StoryContentStep.tsx` — confirm no image upload; remove if present
- `src/components/CreateStory/index.tsx` — update safety acknowledgment copy
- `src/components/StoryCard.tsx` — render flag icons + counts instead of numeric ratings; add green/red summary header
- `src/components/StoryModal.tsx` — same rating display update
- `src/pages/SharePublic.tsx` — mirror the new rating UI for anon posts
- `src/pages/AdminPosts.tsx` — show flag display in moderation queue

**Data:**

- One `supabase--insert` to delete the existing 20 seed posts and insert the new 20 women-celebrity tabloid posts with green/red flag values
- No schema migration needed (reusing existing integer rating columns with signed values)

**Out of scope (already deferred):**

- Post-rejected screen with reasons
- 24h cooldown enforcement
- Nav links to `/share` and `/admin/posts`
- Email notifications for anon approvals