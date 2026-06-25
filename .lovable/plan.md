## Goal

Let admins flip the four moderation queues (Verifications, Posts, Reports, Disputes) between **Newest first** and **Oldest first**. Today they're all hardcoded to newest-first, which makes it hard to clear the oldest backlog ("first-in, first-out" moderation).

## What changes

Each admin page gets a small sort control in its header (next to existing filters):

```
[ Sort: Newest ▾ ]   options: Newest first / Oldest first
```

Selection is local to the page (state, not persisted) and re-runs the query.

Pages affected:
- `src/pages/AdminVerifications.tsx`
- `src/pages/AdminPosts.tsx`
- `src/pages/AdminReports.tsx`
- `src/pages/AdminDisputes.tsx` (via `useDisputes` hook)

## Technical notes

- All four already `order('created_at', { ascending: false })`. Replace the hardcoded `false` with a `sortAsc` boolean piped through from a `useState<'newest' | 'oldest'>` on each page.
- For pages that query inline (Verifications, Posts, Reports), include the sort state in the React Query `queryKey` so changing it refetches.
- For Disputes, `useDisputes` accepts no args today — extend it to take `{ sort: 'newest' | 'oldest' }` and thread it through the query + key.
- UI: reuse the shadcn `Select` component already used elsewhere in admin filters for visual consistency.
- No DB / migration changes. No new dependencies.

## Out of scope

- Sorting by other fields (status, reporter, severity). Easy to add later if needed.
- Persisting the choice across sessions.
