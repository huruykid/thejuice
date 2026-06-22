## Essentials interaction bundle

Adds pull-to-refresh, optimistic reactions, double-tap to like, skeleton loaders, and scroll-to-top — keeping the mobile-first feel intact and working on desktop too.

### 1. Pull-to-refresh (mobile + desktop)

**New hook `src/hooks/usePullToRefresh.ts`** — generic touch/pointer-based PTR with rubber-band resistance.

- Attaches `pointerdown / pointermove / pointerup` to a target element.
- Activates only when the scroll container is at `scrollTop === 0`.
- Tracks pull distance with damping (`distance = Math.pow(rawDelta, 0.8)`).
- Two thresholds: `armDistance` (60px, show "Release to refresh") and `triggerDistance` (90px, fire `onRefresh`).
- Returns `{ bind, pullDistance, isRefreshing, status }` so the consumer can render its own indicator.
- Works with mouse pointer events on desktop too (drag down from the top), so it's not mobile-only.

**New component `src/components/PullToRefreshIndicator.tsx`** — a small animated arrow / spinner that translates with `pullDistance`, rotates on arm, becomes a spinner on refresh. Uses semantic tokens.

**Wire into Home feed** (`src/pages/Home.tsx`):
- Wrap the feed in the PTR container.
- `onRefresh` calls `queryClient.invalidateQueries({ queryKey: ['stories', 'infinite'] })` and `await refetch()` so the existing infinite-scroll state is preserved (we re-fetch from page 0, react-query keeps the rest consistent).
- Show the `PullToRefreshIndicator` at the top of the feed.

### 2. Optimistic reactions

**Update `src/hooks/useReactions.ts`** to add `onMutate` / `onError` / `onSettled` for optimistic UI:

- On click: immediately update both the infinite stories cache (`['stories', 'infinite', ...]`) and the per-story reaction-counts cache so the heart fills and the count bumps instantly.
- Snapshot previous data; roll back on error and toast "Couldn't react, try again".
- `onSettled`: invalidate to reconcile with the server.
- Same pattern across `['stories']`, `['search-stories']`, `['trending-stories']`, `['reaction-counts', storyId]`.

No DB / RLS changes.

### 3. Double-tap to like

**Update `src/components/StoryCard.tsx`**:
- Add a tap-handler that detects two taps within 300ms on the card body (not on the existing buttons — use `e.target` guard).
- On double-tap: trigger `like` reaction via the optimistic mutation (only if not already liked).
- Render a transient heart burst overlay: a centered `<Heart>` that scales from 0 → 1.4 → 1, fades out over 700ms (CSS keyframe, no new deps).
- Works on desktop via `dblclick` too, so it's not mobile-only.

### 4. Skeleton loaders

**Update `src/components/ui/loading-skeleton.tsx`** (or add a new `StoryCardSkeleton`) — a shimmer block that mirrors StoryCard's shape: avatar circle, two text lines, image placeholder, action row.

**Wire into Home + Explore**:
- Initial load: render 6 skeletons in the same column layout (single column on mobile, masonry on desktop).
- Infinite-scroll loading next page: append 3 skeletons at the bottom instead of the current "Loading more stories…" text.

### 5. Scroll-to-top button

**New component `src/components/ScrollToTopButton.tsx`**:
- Fixed bottom-right (above the mobile tab bar with `bottom-24 lg:bottom-8`).
- Appears after `window.scrollY > 600`, fades in/out.
- On click: `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- Wired into Home and Explore.

### Files touched

Created:
- `src/hooks/usePullToRefresh.ts`
- `src/components/PullToRefreshIndicator.tsx`
- `src/components/StoryCardSkeleton.tsx`
- `src/components/ScrollToTopButton.tsx`

Edited:
- `src/pages/Home.tsx` — wire PTR, skeletons, scroll-to-top.
- `src/pages/Explore.tsx` — skeletons + scroll-to-top (PTR optional, will include if it fits cleanly).
- `src/hooks/useReactions.ts` — optimistic update.
- `src/components/StoryCard.tsx` — double-tap handler + heart-burst overlay.

### Out of scope (not in this bundle)

- Realtime "N new stories" pill via Supabase subscription.
- Long-press action sheet, swipe gestures.
- Keyboard shortcuts (j/k/l/c).
- Offline banner.

We can add any of these in a follow-up.

### Acceptance

- iPhone (390×844): drag down from the top of the feed → indicator appears, snaps back, feed refreshes. Double-tap a card → heart burst, count goes up instantly. Scroll past one screen → up-arrow appears.
- Desktop (≥1024): same PTR via mouse drag from top, same double-click behavior, same up-arrow, same skeletons in masonry columns.
- Mobile single-column layout and existing iOS Capacitor behavior unchanged otherwise.
