## Goal

Collapse city browsing into the Home feed using a filter chip — the pattern used by Twitter, Reddit, Yelp, Tinder, and Nextdoor. One feed, one place to look.

## What changes

**Home (`/app`)**
- Add a sticky filter row above the feed with two chips:
  - **All** (default) — current Home feed
  - **[City name] ▾** — shows the user's `profiles.city_id` city; if unset, label reads "Pick a city ▾"
- Tapping the city chip opens the existing `CitySheet` to pick/change city.
- Selecting "All" clears the filter (does not change the saved profile city — just the active view).
- Active chip uses the primary color; inactive is muted. Chip row is sticky under the header so it stays reachable while scrolling.

**Data**
- When "All" is active: existing `useStories` query.
- When city is active: existing `useStoriesByCity(cityId)` query.
- Same `StoryCard` rendering for both — no other UI differences.
- Empty state for a city with no posts: "No juice from [City] yet. Be the first to post."

**Bottom navigation**
- Remove the "Near You" tab. Reclaim that slot — leave it empty for now (4 tabs instead of 5) so we don't have to invent a new destination this round.
- `/near-you` route stays mounted and redirects to `/app` so any old links/bookmarks don't 404.

**Profile**
- City picker stays on Profile as the "set your default" surface (unchanged). The Home chip is the everyday switcher.

## Out of scope

- Multi-city selection, radius search, or map view.
- Inferring city from device location.
- Saving the chip selection across sessions (resets to "All" each visit — same as Twitter's tab behavior).

## Technical notes

- New component `CityFilterChips` in `src/components/`, consumed by `src/pages/Home.tsx`.
- Local `useState<'all' | 'city'>` in Home decides which query hook runs; only one is `enabled` at a time so we don't double-fetch.
- `CitySheet` already handles persisting `profiles.city_id` — reuse as-is.
- `/near-you` route in `src/App.tsx` becomes `<Navigate to="/app" replace />`.
- `Navigation.tsx` / `DesktopSidebar.tsx`: drop the Near You entry.
- No DB migration. No new dependencies.

## Files touched

- `src/pages/Home.tsx` — add chip row, branch query
- `src/components/CityFilterChips.tsx` — new
- `src/App.tsx` — redirect `/near-you`
- `src/components/Navigation.tsx` — remove Near You tab
- `src/components/layout/DesktopSidebar.tsx` — remove Near You link
- `src/pages/NearYou.tsx` — delete (or leave dead, your call)
