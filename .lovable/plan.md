Add a bulk reject action to the Verifications admin page, mirroring the existing bulk approve flow and sending a rejection email to each user.

### What changes
- In the existing pending-selection toolbar on `AdminVerifications.tsx` (next to "Bulk approve"), add a destructive "Reject selected" button.
- Clicking it opens a confirmation dialog (shadcn `AlertDialog`) with:
  - Count of users about to be rejected
  - Optional shared "Reason" textarea (sent in the email and stored in `user_verifications.notes`)
  - Confirm / Cancel
- On confirm, iterate selected pending verifications and for each one:
  1. Update `user_verifications` row → status `rejected` + notes (reuses existing `updateVerificationMutation` logic).
  2. Fetch the user's email via the existing `get-user-email` edge function.
  3. Invoke the existing `send-rejection-email` edge function with `{ email, username, reason }`.
- Show progress in the toolbar ("Rejecting 3/10…") using the same `bulkProgress` pattern already used for bulk approve.
- On completion: clear selection, invalidate `admin-verifications` and `admin-pending-counts`, toast success/failure counts (e.g. "Rejected 8, failed 2").

### Notes
- No DB schema or edge function changes — `send-rejection-email` and `get-user-email` already exist and are used by the single-reject path.
- "Select all" checkbox already exists for pending; same selection set is reused.
- Reason is optional, matching the single-reject behavior.
- Sends are sequential (same as bulk approve) to avoid hammering the email queue.