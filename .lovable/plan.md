# Revised run-list (4 passes, not 6)

Folds your 6 prompts into 4 to avoid double-work, swaps the unverified gate to the blurred-teaser model, and keeps Light + Dark as already built. DB is already live — no schema work here.

---

## Pass 1 — Posting model + Unverified blurred-teaser feed

**Files:** `src/pages/Index.tsx`, new `src/pages/UnverifiedHome.tsx`, `src/hooks/useStories.ts`, `src/components/CreateStory/*`

Routing in `Index.tsx`:
- Logged out → `AuthScreen` (unchanged).
- Logged in + verified → existing `Home` + `CreateStory` + full nav.
- Logged in + not verified → `UnverifiedHome` (no full feed access, no bottom nav beyond Home/Profile).
- Remove the forced 5-step `EnhancedProgress` onboarding gate.

`UnverifiedHome` layout (top → bottom):
1. **Hero CTA card:** "Share your first story" → opens `CreateStory`. Subtext: "Post now — an admin reviews before it goes live."
2. **Verify card:** "Verify to unlock the full feed." Button → `ProfileCreation` (if no profile) → `RefactoredSelfieCapture` → `EnhancedWelcomeScreen` → `VerificationPending`.
3. **Blurred teaser feed:** render the real approved-stories feed (same `useStories` query, limit 6), wrapped in a container with `filter: blur(8px) saturate(0.8)` + `pointer-events-none` + a centered overlay ("Verify to read real stories from verified men" + Verify button). Proves the app isn't empty without leaking content.
4. **Your submissions:** list of the current user's own stories with status badges (Pending review / Approved / Rejected). Never show other users' posts here.

`CreateStory` must accept users without a profile — post as "Anonymous". On submit by unverified user, toast: "Submitted! An admin will review it before it goes live. Verify to read everyone else's stories."

`useStories.ts`: main feed query filters `status = 'approved'`. Submissions list uses a separate query scoped to `user_id = auth.uid()` with all statuses.

**Test before moving on:** unverified account can post, sees blurred teaser + own submission badge; verified account sees the real feed; logged-out sees auth.

---

## Pass 2 — Admin post-approval queue

**Files:** new `src/pages/AdminPosts.tsx`, `src/App.tsx` (route), `src/pages/AdminVerifications.tsx` (cross-link)

- Protected route `/admin/posts`, same guard pattern as `/admin/verifications` (`useUserRole` → admin check).
- List `stories` where `status = 'pending'`, newest first. Show content, ratings, location, author username or "Anonymous", subject name/phone if present.
- Approve / Reject buttons per row → update `status`. DB trigger stamps approver + timestamp.
- Optimistic remove from list on action, sonner toast.
- Add a card link from `AdminVerifications` → `/admin/posts` with a count badge of pending posts (single `count` query).

---

## Pass 3 — Brand + Landing honesty + SEO cleanup (merged 4 + 5 + 6)

One pass over marketing surface + head.

**Brand → "The Juice App" everywhere user-facing**
- Sweep: "Tea App for Men", "Join the Brotherhood" → "The Juice App". Headers, footers, nav, buttons, copy, image alt, page titles. DB names untouched.
- One tagline only: "Anonymous, verified dating stories from men."

**`src/pages/Landing.tsx`**
- Hero: keep "Sign up now" as the only primary button. "How It Works" → quiet ghost link. Move any "Instagram" reference to the header as a small icon link.
- Delete "Join 10,000+ men already sharing their stories." Replace with: "Join the first wave of men sharing real dating tea."
- Remove the fabricated Mike/James/David testimonials block until we have consented quotes.
- Rework "How It Works" to 3 steps: (1) Post your story (even before verifying), (2) Verify your account, (3) Unlock and read real tea from verified men.
- Footer copyright → current year.

**`index.html`**
- Delete BOTH `aggregateRating` JSON-LD blocks (fake 4.8 / 10000 — Google structured-data policy violation).
- Replace every "Join 10,000+ verified men…" in meta description, og:description, twitter:description, JSON-LD descriptions with: "An anonymous, verified community where men share real dating stories."
- Remove the `fb:app_id` placeholder `YOUR_FB_APP_ID` entirely (only re-add when there's a real ID).
- Update `<title>` and brand strings to "The Juice App".

---

## Pass 4 — Theme polish (KEEP Light + Dark)

Not dark-only. Light + Dark are first-class per our prior decision; `ThemeToggle` and `useTheme` stay.

- Smart defaults: Landing/marketing routes default to light, `/app`, `/explore`, `/near-you`, `/profile`, `/activity` default to dark on first visit; user toggle persists in localStorage (already wired).
- `.glass` utility: switch to `bg-card/60 backdrop-blur border-border` so it adapts to both themes (currently `bg-white/80` breaks in dark).
- Sweep for hardcoded light styles: `bg-white` → `bg-card`, `text-black` → `text-foreground`, `bg-gradient-soft` and white card backgrounds on `Landing.tsx`, `AuthScreen.tsx` → `bg-background` / `bg-card`.
- Confirm `.gradient-text` is mono-amber (already swapped) and `--gradient-primary` is amber-only.
- WCAG AA pass on: body text on `--background`, muted text on `--background`, button label on amber `--primary` (ink-on-amber, already locked).

---

## Out of scope / explicitly NOT shipping

- Hard "contribute-to-unlock" wall — defamation/harassment incentive risk + admin bottleneck. Soft blurred teaser delivers the upside.
- Dark-only forcing — we keep both themes.
- Cold-start fix is manual: you seed ~15–20 approved stories. No prompt fixes empty supply.

---

## Technical notes

- Blur overlay: `<div class="relative"><div class="pointer-events-none blur-md saturate-50 opacity-70">...feed...</div><div class="absolute inset-0 flex items-center justify-center"><VerifyCTA/></div></div>`. Reuses `useStories` — no new query.
- `useStories.ts` already filters server-side via RLS for verified readers; add an explicit `.eq('status', 'approved')` for safety/clarity.
- Admin queue uses `useQuery` keyed `['admin','pending-posts']` with `useMutation` for approve/reject and `queryClient.setQueryData` for optimistic removal.
- Stale `build:dev` error in your paste is already resolved — current build passes.

Approve and I'll execute Pass 1 first, stop for your test, then continue.
