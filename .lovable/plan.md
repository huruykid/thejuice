## What's already in place

- `useApproveUser` already sends `send-approval-email` after marking a verification approved.
- `AdminPosts` already lists pending stories with per-row Approve/Reject.
- `UnlockBanner` + seed feed already enforce the "post one story to see the community feed" rule for approved-but-not-yet-posted users.

So the workflow is structurally there. Two real gaps:

1. The approval email copy doesn't mention the "post one story to unlock" requirement, so newly approved users don't know what's expected.
2. `AdminPosts` has no way to approve in bulk — every story is a separate click.

## Changes

### 1. Update the approval email copy (`supabase/functions/send-approval-email`)

Rewrite the email so the call-to-action is unambiguous:

- Subject: `You're in — post one story to unlock the Juice feed`
- Body, in plain language:
  - Welcome, your account is approved.
  - **To unlock the full community feed, post at least one story.** Until then, you'll see editorial/seed posts only.
  - Every post is reviewed by us before it goes live — usually within 24 hours.
  - Single CTA button: "Post your first story" → `https://sipjuice.app/app`
  - Short reminder about anonymity and the "allegedly" framing.
- Strip the gradient/purple template; use the existing Juice orange brand. Keep it simple — no feature grid.

No schema change. No new secret (Resend already configured).

### 2. Add bulk-approve to `AdminPosts` (`src/pages/AdminPosts.tsx`)

- Add a checkbox to each pending row.
- Sticky action bar at the top of the pending list: `[ ] Select all on this page  ·  Approve selected (N)  ·  Clear`.
- Bulk approve = a single `update().in('id', selectedIds)` setting `status='approved'` and `approved_at=now()`. One round-trip, atomic in Postgres.
- Reject stays per-row only — rejection needs a reason, bulk-rejecting would be sloppy.
- After bulk approve: clear selection, invalidate `admin-posts` query, toast `"Approved N posts"`.
- Checkboxes only render on the `pending` filter view (selection is meaningless on approved/rejected lists).

### 3. (Nit) Make sure the admin gets to the queue easily

Add a small "Pending posts (N)" link in the `DesktopSidebar` (admin only) and in the existing AdminVerifications page header, so once a batch of users is approved you can jump straight to moderating the stories they'll start posting. Uses `useUserRole` to gate visibility; no new route.

## Out of scope (call out, don't build)

- Email when a **post** is approved/rejected. Useful but separate — confirm before adding, since it doubles the email volume.
- Admin push/realtime notifications for new pending posts.
- Rate-limiting how many stories one user can submit per day.
- Auto-approving trusted users after N approved posts.

## Files touched

- `supabase/functions/send-approval-email/index.ts` — rewrite copy + subject.
- `src/pages/AdminPosts.tsx` — add selection state, bulk-approve mutation, action bar.
- `src/components/layout/DesktopSidebar.tsx` — add admin-only "Moderation" links.

## End-to-end flow after this ships

1. User submits verification → you approve in `/admin/verifications`.
2. They get the new email: "you're in — post one story to unlock the feed."
3. They log in → see the seed feed + `UnlockBanner` prompting them to post.
4. They submit a story → goes into `pending` queue.
5. You open `/admin/posts`, tick the good ones, hit **Approve selected** once.
6. As soon as their first post flips to `approved`, `user_has_approved_post()` returns true and their next visit shows the full community feed.
