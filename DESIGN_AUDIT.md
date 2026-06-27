# Design Audit — Juice (all screens)

Audited ~35 screens across four buckets (public/marketing, auth/onboarding, core app, admin)
against a fixed rubric: brand/logo, color tokens, hierarchy, type, mobile/a11y, microcopy,
states, industry-standard patterns.

## Root cause (why "basic" issues keep slipping through)

A clean system **exists** — semantic CSS tokens (`--primary`, `--success`, `--destructive`,
`--muted`, `--border`, `--foreground`) and the shared `<BrandLockup>`. But roughly 60% of
screens **predate** it and were never migrated. The shared chrome (header/footer) is on-system;
individual pages drifted away from it. The problems are **systemic and cross-cutting**, not
one-offs — which is exactly why they're invisible page-by-page and only obvious in aggregate.
The fix is global sweeps + a few "can't-drift-again" guardrails, not 35 individual touch-ups.

---

## P0 — fix first

**1. Off-system color sprawl (the single biggest issue).** Raw Tailwind/brand colors instead
of tokens, in the majority of screens:
- `juice-orange` (9 of 12 public pages, AuthScreen, ResetPassword, Activity, DesktopSidebar…),
  plus **`juice-pink`** and **`juice-blue`** — second/third accents that violate the
  single-amber rule entirely.
- `red-600/700/50/300` for delete (6 of 8 admin pages), `green-600`, `amber-600`,
  `emerald-700`, `yellow-100`, `blue-50` (SelfieCapture info box).
- `text-white` on amber/gradient surfaces (Landing, SelfieCapture, OnboardingSuccess,
  UsernameCreation) → should be `--primary-foreground`.
- Gradient-clip wordmark H1s (`bg-gradient-primary bg-clip-text text-transparent`) on
  Landing, DatingStoriesForMen, AnonymousDatingReviews, MensDatingAdvice, MaleDatingCommunity,
  WelcomeScreen, ResetPassword, UsernameCreation.
→ **Global migration to semantic tokens; delete `juice-pink`/`juice-blue`.**

**2. Logo still hand-placed on several screens** (instead of `<BrandLockup>`): SelfieCapture,
WelcomeScreen (also wrong wordmark "Juice"), ResetPassword, UsernameCreation, DesktopSidebar,
Landing (line 385), and Home/UnverifiedHome (hand-rolled `ig-wordmark`).
→ **Finish the BrandLockup rollout everywhere.**

**3. Duplicate chrome — same bug class as the double-logo header you just hit.** Five marketing
pages render their **own `<footer>`** on top of PublicLayout's PublicFooter → duplicate footers
+ a stale `© 2024`: Landing, DatingStoriesForMen, AnonymousDatingReviews, MensDatingAdvice,
MaleDatingCommunity. → **Remove the page-level footers.**

**4. Functional bugs.**
- `WelcomeScreen.handleNext` early-returns at the final step → the final CTA does nothing
  (legacy screen, but verify it's unused before deleting).
- `AdminSeed` runs `navigate()` in the render body instead of `useEffect`.
- Two parallel selfie components (`SelfieCapture` legacy vs `RefactoredSelfieCapture` clean);
  AuthScreen imports the **legacy** one. Consolidate on Refactored.

**5. Trust / legal.** Landing shows hardcoded fake stats ("1,200+ verified men / 3,400+
stories") and uses real Unsplash faces as "subjects" in the mock. → Use real numbers (or honest
non-numeric copy) and illustrated placeholders.

---

## P1 — consistency + correctness

- **Admin divergence (fix once, globally):** destructive confirms split three ways
  (`window.confirm` vs `AlertDialog` vs `Dialog`) → one `<ConfirmDialog>`. Status badges split
  three ways (`<Badge>` vs bespoke `STATUS_STYLES` pills vs span) → unify on `<Badge>`. Page
  headers split (plain h1 vs `Flag` icon + `text-juice-orange`) → one `<AdminPageHeader>`.
  Breadcrumb `TITLES` missing `/admin/members`, `/admin/blog`, `/admin/seed`.
- **Missing error states** across feed/search/admin — Home, Explore, StoryDetail, and admin RPC
  lists fall through to a misleading "empty/not found" on query failure. Add error + retry.
- **Inputs without labels** (AuthScreen, ResetPassword, UsernameCreation, Explore,
  AdminMembers) → add `aria-label`/visually-hidden labels; `aria-live` on username availability.
- **CTA label/route chaos:** "Join free"→/app vs "Request Access"→/app vs "Request
  Access"→/auth vs "Browse Stories"→/app. Unify on one primary label + route.
- **Magic-moment search missing from the verified Home** (only unverified has `SubjectSearch`).
- **Destructive-action hierarchy:** "permanently delete user/story" is often the *lightest*
  button (ghost/outline). Make the most dangerous action the clearest destructive affordance.

---

## P2 — polish

- Emoji-heavy generic copy (SelfieCapture toasts "📷 Starting camera…", WelcomeScreen,
  OnboardingSuccess 💫🔍🎭) → on-brand action copy + lucide icons.
- `variant="mark"` (logo only) on onboarding full-page screens → `stacked`/`inline` for wordmark.
- Tap targets <44px: bottom nav (`h-12`), header "Verify" text button, some link-style CTAs.
- `SubjectSearch` "mixed" verdict reuses the red Flag shape → give it a distinct icon.
- Two SEO patterns (`<Helmet>` vs manual `useEffect` DOM writes on Privacy/Terms/Support) →
  standardize on Helmet; standardize brand title suffix.
- `AppShell` only wraps the verified Home → wrap all top-level routes for desktop sidebar parity.
- Word-as-number fake "stat" blocks (Verified/Anonymous/100%/24-7) on 4 marketing pages.

---

## Fix gameplan (phased)

**Phase 1 — mechanical sweeps (highest ROI, low risk):**
1. Global token migration: `juice-orange|juice-pink|juice-blue|red-/green-/amber-/emerald-/yellow- raws|text-white-on-amber` → semantic tokens.
2. Finish `<BrandLockup>` everywhere + remove the 5 duplicate page footers.
3. Standardize admin: `<ConfirmDialog>`, `<Badge>` statuses, `<AdminPageHeader>`, breadcrumb titles.

**Phase 2 — correctness:** error/retry states (feed, search, admin), input labels + `aria-live`,
fix the 3 functional bugs, consolidate the selfie components, replace fake stats.

**Phase 3 — polish:** copy/emoji + lucide icons, tap targets, CTA unification, SEO pattern,
AppShell parity, search on verified Home.

## Prevention (so this stops recurring)

- `<BrandLockup>` (done) = logo by construction.
- **CI guardrail:** ESLint/grep rule that fails the build on raw `juice-orange|juice-pink|juice-blue|text-white` and bare `red-/green-/amber-` color classes in `src/`.
- Promote this rubric into a **PR design-QA checklist**.
- Shared `<ConfirmDialog>` / `<Badge>` status / `<AdminPageHeader>` so admin can't drift.
- A 60-second visual pass on the live build before every Publish.
