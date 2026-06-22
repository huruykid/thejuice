## Goal

Give `/app`, `/explore`, `/activity`, `/profile`, `/codename/:id`, `/author/:id`, `/privacy-settings` a true desktop layout on screens ≥ `lg` (1024px), while keeping the current mobile UI byte-for-byte identical on phones (the Capacitor iOS target).

## What changes

### 1. New `AppShell` layout (`src/components/layout/AppShell.tsx`)
- Wraps every authenticated route.
- Detects breakpoint with Tailwind (`hidden lg:flex` / `lg:hidden`) — no JS state needed, so SSR/mobile behavior is unchanged.
- Layout on `lg+`:

```text
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────┐ ┌──────────────────────┐ ┌──────────────────┐   │
│  │ Sidebar │ │     Main column      │ │  Right rail      │   │
│  │  nav    │ │ (feed / page content)│ │  (trending,      │   │
│  │ + logo  │ │  max-w-2xl           │ │   top tags,      │   │
│  │ + CTA   │ │                      │ │   suggested)     │   │
│  └─────────┘ └──────────────────────┘ └──────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- On mobile (`<lg`): renders `{children}` only, plus the existing `<Navigation />` bottom bar — zero visual diff.

### 2. New `DesktopSidebar` (`src/components/layout/DesktopSidebar.tsx`)
- Built on shadcn `Sidebar` with `collapsible="icon"`.
- Items: Home, Explore, Activity, Profile, + "Share your story" primary button at the top, + "Privacy" and "Sign out" at the bottom.
- Uses `NavLink` + `useLocation` for active route highlight.
- Hidden under `lg` (`hidden lg:flex`).

### 3. New `DesktopRightRail` (`src/components/layout/DesktopRightRail.tsx`)
- Reuses existing hooks: `useTrendingStories`, `useTopTags`.
- Shows: Trending stories (top 5), Top tags, "Suggested codenames" placeholder.
- Hidden under `xl` (so 1024–1279 = sidebar + feed only, 1280+ = three columns).

### 4. Wire AppShell into routes
- In `src/App.tsx`, wrap the authenticated routes (`/app`, `/explore`, `/profile`, `/activity`, `/codename/:id`, `/author/:profileId`, `/privacy-settings`) in `<AppShell>` inside `ProtectedRoute`.
- Each page currently renders its own `<Navigation />` bottom bar. The bottom nav stays — but on `lg+`, `AppShell` hides it with a wrapper `<div className="lg:hidden">…</div>` injected via the page (or by giving `Navigation` itself a `lg:hidden` class — simpler, single change).
- Pages keep their own `max-w-md mx-auto` content wrapper for now; on `lg+`, `AppShell` provides the outer 3-column grid and pages naturally center inside the middle column. Stretching the feed wider (e.g. `lg:max-w-2xl`) is done page-by-page where it makes sense (Home, Explore, Activity).

### 5. Small page tweaks
- `Home.tsx`, `Explore.tsx`, `Activity.tsx`, `Profile.tsx`: change the inner `max-w-md mx-auto` to `max-w-md lg:max-w-2xl mx-auto`, and the sticky top header to `lg:hidden` (because the desktop sidebar already brands the app).
- `Navigation.tsx`: add `lg:hidden` to the root `<nav>` so the bottom bar disappears on desktop.

### 6. Marketing pages and onboarding
- Untouched. Landing/Blog/SEO pages are already responsive. Auth + onboarding screens (`AuthScreen`, `ProfileCreation`, `RefactoredSelfieCapture`, etc.) stay mobile-centered for now (they're short flows, look fine centered on desktop).

## Technical notes

- **Mobile is unchanged.** All desktop styling is gated behind `lg:` Tailwind classes. No behavior changes below 1024px, so the Capacitor iOS bundle renders identically.
- **No new dependencies.** Reuses shadcn `Sidebar` already in the project.
- **No design system changes.** Uses existing semantic tokens (`bg-background`, `border-juice-orange/10`, `gradient-text`).
- **Out of scope:** redesigning individual cards/modals for desktop, adding desktop-only features (keyboard shortcuts, hover previews, multi-pane story view), tablet (`md`) layout — tablet keeps the mobile layout for now.

## Files touched

Created:
- `src/components/layout/AppShell.tsx`
- `src/components/layout/DesktopSidebar.tsx`
- `src/components/layout/DesktopRightRail.tsx`

Edited:
- `src/App.tsx` (wrap authenticated routes)
- `src/components/Navigation.tsx` (add `lg:hidden`)
- `src/pages/Home.tsx`, `Explore.tsx`, `Activity.tsx`, `Profile.tsx` (widen content + hide mobile top header on `lg+`)

## Acceptance

- iPhone preview (390×844): pixel-identical to today.
- Desktop (≥1024): left sidebar with nav + CTA, centered feed up to `max-w-2xl`, no bottom tab bar.
- Wide desktop (≥1280): adds a right rail with trending / top tags.
- All existing routes still work; active route highlighted in sidebar.
