# Admin enhancements

Three additions, all admin-only.

## 1. Pending-count badges in `AdminNav`

The existing pill nav (`src/components/AdminNav.tsx`) gains a small numeric badge next to each label so workload is visible at a glance.

- New hook `useAdminPendingCounts` runs three lightweight `head: true, count: 'exact'` queries:
  - `user_verifications` where `verification_status = 'pending'`
  - `stories` where `status = 'pending'` and `is_seed = false`
  - `reports` where `status = 'pending'`
- Counts cached via React Query (30s stale), refetched on window focus.
- Badge only renders when count > 0. Zero state stays clean.

## 2. Admin Overview page at `/admin`

New `src/pages/AdminOverview.tsx` becomes the landing page for admins.

Layout:

```text
[ AdminNav ]
Admin overview
Quick read on what needs attention.

[ Pending verifications ] [ Pending posts ] [ Pending reports ]
        12 →                     3 →                 0 →

[ Activity last 7 days ]
- New signups: N
- Verifications approved: N
- Posts approved: N
- Reports resolved: N

[ View as ▾ ]   (see section 3)
```

- Stat cards link to their respective admin page.
- 7-day activity uses simple counts on `profiles.created_at`, `user_verifications` (approved + updated_at), `stories` (approved + approved_at), `reports` (resolved + reviewed_at).
- Route `/admin` added in `src/App.tsx`, gated by admin role like the others.
- A new "Overview" item is prepended to `AdminNav`.

## 3. "View as" UI-only role switcher

Admin can preview the app as a different user type without losing their session.

### How it works

- New `ViewAsContext` (`src/contexts/ViewAsContext.tsx`) stores a `viewAs` value in `sessionStorage`:
  - `null` (default — true admin view)
  - `"logged_out"` — pretend no session
  - `"unverified_user"` — logged in but no approved verification
  - `"verified_user"` — logged in, verified, not admin
- Wrapped around `<App />` in `src/main.tsx` so every page sees it.
- `useAuth`, `useUserRole`, and `useIsVerified` get a thin override layer that respects `viewAs` when an admin sets it. Non-admins can never toggle — guarded server-side by the existing `has_role` check and client-side by ignoring the override unless the real role is admin.

### UI

- Floating control rendered only for real admins (new `src/components/ViewAsBar.tsx`):
  - Fixed bottom-right pill: "Viewing as: Admin ▾"
  - When active (anything other than admin), bar turns amber and shows "Exit preview" button.
  - Dropdown options: Admin (default), Logged-out visitor, Unverified user, Verified user.
- Mounted once in `App.tsx` so it appears on every route.
- Also surfaced as a section on the Admin Overview page for discoverability.

### Important constraints

- **UI-only.** No real auth changes, no row-level security bypass — the admin's real JWT keeps making requests, so they can technically still see admin data via the network. The preview is for "does this page look right for that user type?", not for security testing.
- Reset on logout and on tab close (sessionStorage).
- Never persisted to the database.

## Technical notes

- Files to create:
  - `src/hooks/useAdminPendingCounts.ts`
  - `src/pages/AdminOverview.tsx`
  - `src/contexts/ViewAsContext.tsx`
  - `src/components/ViewAsBar.tsx`
- Files to edit:
  - `src/components/AdminNav.tsx` (add Overview item + badge support)
  - `src/App.tsx` (add `/admin` route, mount `ViewAsBar`)
  - `src/main.tsx` (wrap with `ViewAsProvider`)
  - `src/hooks/useAuth.ts`, `src/hooks/useUserRole.ts`, `src/hooks/useIsVerified.ts` (apply override when admin + viewAs set)
- No database migrations.
- No new edge functions.
