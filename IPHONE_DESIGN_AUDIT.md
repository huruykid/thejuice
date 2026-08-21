# iPhone Design System Audit — Juice

*Scope: the native/mobile app experience — page scaffolds, navigation, modals & sheets, spacing, safe areas, keyboard, dark mode. Complements DESIGN_AUDIT.md (which covered color tokens, BrandLockup, admin drift); nothing here repeats it.*

**Verdict: no, the iPhone design system is not optimal yet.** The IG-bones system is real and the newest screens (Home, StoryCard, Composer, Explore, Profile, StoryDetail) hold it well. But three design languages still coexist page-to-page, there are **five different modal/overlay implementations**, and — the biggest one — **the app has no iOS safe-area system at all**. On a notched iPhone that shows up as chrome colliding with the Dynamic Island and home indicator, and a keyboard that covers the comment box.

---

## P0 — iOS correctness (these are visible on every notched iPhone)

### 1. No safe-area handling anywhere
- `index.html` viewport is `width=device-width, initial-scale=1.0` — **no `viewport-fit=cover`**, so `env(safe-area-inset-*)` always returns 0 even if you used it.
- `grep safe-area src/` → **zero hits**. Nothing pads for the notch or home indicator.
- The app leans on Capacitor `contentInset: 'always'`, which insets *scrolling content* but not fixed chrome. Consequences:
  - **Bottom tab bar** (`Navigation.tsx`, fixed `h-12`) sits flush against the home indicator — taps on Home/Explore/Create/Profile compete with the system swipe-up gesture.
  - **PhotoLightbox** close button at `top-3` and the counter at `top-4` land under the Dynamic Island / status clock (it's a `fixed inset-0 z-[100]` overlay covering the physical screen).
  - **CitySheet / CreateStory sheet** content runs to the physical bottom edge — last list row and the "Pass on the Juice" button sit in the home-indicator zone.

**Fix (one pass, app-wide):**
1. `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`
2. Capacitor iOS: `contentInset: 'never'` (let the web layer own insets).
3. Tab bar: `pb-[env(safe-area-inset-bottom)]` on the `<nav>` (keep the 48px content row); bump page bottom padding to `pb-[calc(5rem+env(safe-area-inset-bottom))]`.
4. Sticky headers: `pt-[env(safe-area-inset-top)]` on the header, background extends behind the status bar.
5. Full-screen overlays (lightbox, sheets): pad top controls and bottom content with the insets.

### 2. Content occluded behind the tab bar — `AuthorStories.tsx`
The page root is `min-h-screen bg-gradient-soft` with **no `pb-20`** — the last story card is physically hidden behind the fixed bottom nav. (Every other tab page has `pb-20`.) Also uses `bg-gradient-soft`, which doesn't exist (see P1-3).

### 3. Keyboard covers the comment composer — `CommentsModal.tsx`
Comments open as a **centered** Radix Dialog (`h-[80vh]`, translate -50%/-50%) with the textarea at the bottom. On iPhone the keyboard slides over the bottom half of a centered dialog — the input you're typing into is hidden. This is the single most common interaction in the app after voting. Fix by moving comments to the bottom-sheet primitive (P1-1): sheet pinned to bottom, input row above the keyboard, list scrolls behind it (the IG comments pattern).

### 4. Auth screen is broken in dark mode — `AuthScreen.tsx`
Cards are hardcoded `bg-white/90` while all text inside uses `text-foreground` / `text-muted-foreground`. In dark mode foreground is near-white → **near-white text on a white card**. First screen a returning dark-mode user sees. Replace with `bg-card` and let tokens do their job (same for the forgot-password card).

### 5. Launch brand flash — `capacitor.config.ts`
Splash `backgroundColor: '#ff6b35'` is the **old orange**; the brand is now amber `#f8b038` (and `theme-color` meta is `#F8B23A`). Every cold start flashes the wrong brand color for 2 seconds, then cuts to white. Set splash to the amber (or black in dark), and shorten `launchShowDuration`.

---

## P1 — one app, one system

### 1. Five overlay implementations → two primitives
Current inventory:

| Overlay | Implementation | Scrim | Corner | z |
|---|---|---|---|---|
| Comments | Radix Dialog, centered | black/80 | square on mobile | 50 |
| Confirms / delete account | Radix AlertDialog | black/80 | square on mobile | 50 |
| City picker | hand-rolled bottom sheet | foreground/40 + blur | rounded-t-2xl | 60 |
| Create story | hand-rolled, `items-end p-4` | black/50 + blur | rounded-t-3xl | 50 |
| Photo lightbox | hand-rolled | black/95 | — | 100 |

Every one has a different scrim, radius, header pattern, and z-index — and `ui/sheet.tsx` + `ui/drawer.tsx` (vaul) sit unused. The CreateStory sheet isn't even flush to the bottom: `p-4` makes it float 16px above the edge, so it reads as neither a sheet nor a dialog.

**The rule to adopt (iOS-native):**
- **Bottom sheet** (one shared component: grabber, `rounded-t-2xl`, safe-area bottom padding, drag-to-dismiss) for anything with input or a list: Comments, City picker, Create story, Report/Block forms.
- **Centered AlertDialog** only for confirmations (delete story, delete account).
- Full-screen viewer stays for the lightbox (it's good — 44px targets, gestures, focus management).
- One scrim token (`bg-black/50 backdrop-blur-sm`), one z-scale (`nav 40 < sheet 50 < dialog 60 < lightbox 100` — today CitySheet at 60 outranks dialogs, and nav shares z-50 with dialogs).

### 2. Three page languages → one scaffold
- **System A (IG-bones, keep):** Home, Explore, Profile, StoryDetail, UnverifiedHome — sticky `h-12` hairline header, flush feed.
- **System B (legacy gradient):** `Activity.tsx`, `PrivacySettings.tsx` — `bg-gradient-to-br from-primary/5`, `text-2xl font-bold` title + icon, `border-primary/20` cards, gradient avatars. Activity is **one tap from Home** (the heart icon) and feels like a different app.
- **System C (dead-class era):** AuthorStories + the onboarding screens — `bg-gradient-soft` centered cards, spinners.

Build one `<PageScaffold title back? action?>` and migrate B and C onto it. It also kills the drift already visible inside System A:
- Header inner widths disagree with their content: Home header `max-w-md` over a `max-w-xl` feed; Explore `max-w-3xl`; StoryDetail `max-w-xl`; Profile `max-w-md`.
- Header titles: wordmark (Home) / `@username` base-semibold (Profile) / "Story" sm-semibold (StoryDetail) / 2xl-bold + icon (Activity, Privacy). Pick the IG convention: base/semibold centered or left, wordmark only on Home.
- Back buttons: hand-rolled `p-2` circle (StoryDetail) vs `Button ghost size-icon` (Activity, Privacy, AuthorStories).
- Loading: skeleton cards (Home) vs spinner (AuthorStories) vs "Loading…" text (StoryDetail). Standardize on `StoryCardSkeleton` for feeds.

### 3. Dead tokens are still trapping new code
- `bg-gradient-soft` is used in **7 files** (App.tsx route fallbacks, AuthScreen, all onboarding screens, AuthorStories) but is defined nowhere — it silently renders as transparent. Either define it or (better, IG-bones) replace with `bg-background` and delete.
- `button.tsx` still ships `gradient`, `glass`, `glass-dark`, `juice`, `juice-soft`, `juice-outline`, `flag-green/red` variants with `rounded-2xl`/`rounded-xl` overrides and glow shadows — all contradicting the flat system. AuthScreen still uses `variant="juice"` + `rounded-2xl` inputs + `rounded-3xl` cards. Purge the variants, and the radius scale collapses back to `sm/md/lg`.
- Typography contradiction in `index.css`: `@layer base` sets h1/h2 to Barlow Condensed uppercase 800; `@layer components` then overrides all h1–h6 to Barlow 700. The display font is dead code that still ships as a font download. Decide (IG-bones says: Barlow only), delete the loser, and drop Barlow Condensed/Bebas from the font payload.

### 4. Onboarding is a different product than the app it lands in
Auth (white gradient cards, h-14 juice buttons) → Welcome (bullet-dot card) → Selfie → Pending → Success (emoji feature list) → then suddenly the flat IG app. Beyond the dark-mode bug, the flow needs one full-screen onboarding scaffold: `bg-background`, BrandLockup top, content middle, **one primary CTA pinned in the thumb zone with safe-area padding**, and a step indicator (auth → profile → selfie is 3 steps and users never know where they are). Copy is already decent; this is a reskin, not a rewrite.

### 5. Navigation logic nits
- **"Edit profile" goes to Privacy & Safety**, which explicitly says username changes require support. A button that names a destination it can't deliver erodes trust — either build a small edit sheet (username/city) or rename the button.
- Activity's empty state says only "when someone comments" — reactions trigger activity too.
- Two toast systems are mounted (shadcn Toaster + Sonner) and pages use them inconsistently (CommentsModal/CitySheet → shadcn; PrivacySettings → sonner). Pick sonner, delete the other.

---

## P2 — polish pass

- **Tap targets under 44pt:** header icon buttons `p-1` (~32px) on Home/Profile; StoryCard kebab `h-8 w-8`; comment delete `h-6 w-6`; the Radix Dialog's built-in X (~20px); UnverifiedHome "Verify" text link; carousel prev/next `h-8`. The StoryCard vote row is already right (`min-h-11`) — hold that bar everywhere.
- **Sticky hover on touch:** `hover:scale-[1.02]` on the Button base and `.interactive` leaves buttons stuck mid-zoom after a tap on iOS. Wrap hover effects in `@media (hover: hover)`; keep `active:scale-95` (that part feels great).
- **Focus states:** hand-rolled buttons (tab bar, header icons, sheet rows) have no `focus-visible` ring; shadcn ones do. Matters for keyboard/switch access.
- **StoryCard rhythm:** `border-b` + `mb-2` double-separates cards. IG is flush hairlines — drop the `mb-2`.
- **StoryModal.tsx** appears to be dead code now that `/story/:id` exists — confirm and delete rather than letting a sixth overlay pattern linger.
- **Spacing tokens:** de facto standards are right (page gutter `px-4`, header `h-12`, section gap `space-y-5`, control heights 44/48) — write them down in a DESIGN_SYSTEM.md so Lovable/Claude sessions stop reinventing them.

---

## Suggested order of attack

1. **Safe-area pass** (P0-1) — one PR: viewport meta, capacitor config, nav/header/sheet padding. Test on a Dynamic Island simulator.
2. **Quick P0 bugs** — AuthorStories `pb`, AuthScreen `bg-card`, splash color. Tiny diffs, big credibility.
3. **Bottom-sheet primitive** + move Comments (fixes the keyboard bug), City picker, and CreateStory onto it.
4. **PageScaffold** + migrate Activity, PrivacySettings, AuthorStories.
5. **Onboarding reskin** on the same scaffold.
6. **Purge pass** — dead variants, gradient-soft, display font, StoryModal, second toast system.

Steps 1–2 are a day and remove every "this feels off on my iPhone" moment. Steps 3–4 are where the app starts feeling like one designed object.
