## Instagram-bones redesign — sequential plan

Goal: keep Instagram's structural language (hairline dividers, mono ink, square media, icon-row actions, 5-tab bottom nav, grid Explore) but with our juice-orange as the single saturated accent. Light + dark, both first-class.

---

### Open decision before we build (please confirm)

**Location / "Near You" feed.** Your project memory currently says *"No location features or geolocation allowed"* and *"Location Disabled."* But the `stories` table already has a `city_id` (joined to `cities`) — that's a **tag**, not device GPS.

Two ways to give you an IG-style local feed without breaking the memory:

- **A. City tab (recommended)** — user picks a city in their profile (or one-tap from a search). Feed filters by that `city_id`. Zero device permissions, no GPS, no IP lookup. Compatible with current memory.
- **B. Skip it** — no near-you tab. Explore stays as a global discovery grid.

Default I'll use unless you say otherwise: **A**.

---

### Sequential build order

**Step 1 — Tokens & theme foundation**
- Rewrite `src/index.css` `:root` and `.dark` blocks to IG-grade neutrals:
  - Light: `bg #ffffff`, `surface #fafafa`, `ink #0a0a0a`, `muted #737373`, `hairline #dbdbdb`
  - Dark: `bg #000000`, `surface #121212`, `ink #fafafa`, `muted #a8a8a8`, `hairline #262626`
- Single saturated accent stays juice-orange `#ff5722` — used only for: Spill/Create button, active tab dot, active flag-vote fill, link color.
- `--radius: 0.5rem` (IG uses subtle rounding on inputs/avatars, not the brutalist 0 we just shipped).
- Drop the brutalist `shadow-brut*` tokens; switch to flat hairline borders.
- Typography: SF Pro / Inter for body (Instagram's actual stack), keep Bebas off; one display weight reserved for the wordmark only.
- Add `ThemeProvider` + a `useTheme` hook with `localStorage` persistence and `prefers-color-scheme` default. Toggle lives in Profile.

**Step 2 — Top header (mobile + desktop)**
- Mobile: 44px sticky bar. Left = "Juice" wordmark (one custom display font). Right = heart icon (Activity) + DM/comments icon. Hairline bottom border. No glass blur, no gradient.
- Desktop ≥ `lg`: leaves the existing left sidebar in place but restyles it to IG's desktop sidebar (icon + label, 240px collapsed to 72px below `xl`).

**Step 3 — Bottom tab nav (mobile only)**
- 5 tabs, equal width, 48px tall, hairline top border, no center notch:
  `Home · Explore · Create (+) · Near You · Profile`
- Active = filled glyph + juice-orange 4px dot under it (IG pattern).
- Activity moves into the header heart icon to free a slot for Near You (matches current IG).

**Step 4 — `StoryCard` (the IG post)**
- Remove the brutalist black header + offset shadow. New shape:
  - **Top row**: 32px circular avatar with subject initial → subject name (semibold) + "Spilled by @author" muted small → `MoreVertical` on the right.
  - **Media**: full-bleed square (1:1) on first image; carousel dots if multiple. No border, no rounding.
  - **Action row** (under media, full IG rhythm): `🚩 Red Flag` `🟢 Green Flag` `💬 Comments` on the left, `Share` on the right. Outlined icons; tapped state fills with juice-orange (red flag) / juice-green (green flag).
  - **Counts line**: `1,204 flags · 64 comments`.
  - **Caption**: `@subjectName` bold inline, then story text. "more" truncation at ~3 lines.
  - **Tags**: small muted hashtag-style chips, no border.
  - **Time + location** muted footer.
- Keeps every existing handler: `handleReaction`, `handleComment`, `handleDelete`, double-tap → green flag, heart burst (recolored juice-orange).

**Step 5 — Explore page (IG grid)**
- Rewrite `src/pages/Explore.tsx` as a 3-column edge-to-edge grid of square thumbnails for stories with images. Stories without images render as text tiles (juice-orange background, condensed quote, ink text) so the grid stays full.
- Tapping a tile opens the existing `StoryCard` view (full post) in a route or modal.
- Top of Explore: search bar (subject/tag/city), then the grid.
- Infinite scroll reuses `useInfiniteStories` with a new ordering option.

**Step 6 — Near You page (city-filtered, no GPS)**
- New route `/near-you`, wired to the bottom-nav slot.
- Profile gains a "Your city" picker (typeahead over existing `cities` table). Stored on `profiles` (new nullable column `city_id` if not present — check before migrating).
- Hook `useInfiniteStoriesByCity(cityId)` filters `stories` server-side by `city_id`.
- Empty state when no city set: "Pick your city" CTA → opens profile picker sheet.
- If no city is set and the user dismisses, fall back to global feed with a banner.

**Step 7 — Comments modal**
- Restyle `CommentsModal` to IG's bottom-sheet pattern: drag handle, avatar + comment rows, reply nesting, send bar pinned to bottom with juice-orange send button when text is present.

**Step 8 — Profile**
- IG-style header: avatar, codename, stat row (`stories · flags received · comments`), Edit Profile + Theme toggle buttons, then a 3-tab segmented control (`Posts · Liked · Saved`) over a square grid of the user's stories.

**Step 9 — QA pass**
- Capture mobile + desktop screenshots in both themes with Playwright.
- Verify: vote tap states, double-tap heart burst, infinite scroll, pull-to-refresh indicator still themed correctly, bottom-nav active dot, Explore grid alignment, Near You empty state, dark-mode contrast on every surface touched.

---

### Out of scope (explicit)

- Auth screens, onboarding, welcome screen, More panel admin views — keep current look for now. Easy follow-up.
- DMs / direct messaging — IG has them, you don't, not adding.
- Stories / reels at the top of the feed — not implementing unless you ask.
- Algorithmic ranking — feed stays chronological.
- Any device geolocation or IP-based location — explicitly excluded per project memory.

---

### Technical notes (skip if not relevant)

- `index.css`: full token rewrite, both `:root` and `.dark`. Add semantic tokens `--surface`, `--hairline`, `--icon`, `--icon-active`.
- `tailwind.config.ts`: drop `shadow-brut*`, set `borderRadius.DEFAULT` to `0.5rem`, restore `fontFamily.sans` to Inter (already installed transitively, otherwise add `@fontsource/inter`).
- `main.tsx`: keep Bebas Neue import only for the wordmark; add Inter weights 400/500/600/700.
- New: `src/components/ThemeToggle.tsx`, `src/hooks/useTheme.ts`, `src/pages/NearYou.tsx`, `src/hooks/useInfiniteStoriesByCity.ts`, `src/components/CitySheet.tsx`.
- Modify: `App.tsx` (add `/near-you` route + ThemeProvider), `Navigation.tsx`, `StoryCard.tsx`, `Home.tsx`, `Explore.tsx`, `Profile.tsx`, `CommentsModal.tsx`, `PullToRefreshIndicator.tsx`, `ScrollToTopButton.tsx`, `StoryCardSkeleton.tsx`.
- Possible migration: add `city_id uuid` to `profiles` if not already there. Will check `profiles` schema before writing migration.
- Reuses all existing hooks: `useReactions`, `useStories`, `useInfiniteStories`, `useReactionCounts`, `usePullToRefresh`.

---

### Estimate

~8–10 file edits, 4 new files, 1 small migration (only if `profiles.city_id` doesn't exist). One build pass with screenshot QA.

Confirm A vs B on the Near You question (or just approve to accept A) and I'll ship it.
