## Goal

Notify the 3 existing posters (whose stories have no `image_url`) that we now require a photo, and ask them to repost. Use an AI "UX copy" agent (via Lovable AI Gateway) to draft the email body so the tone matches Juice.

## Affected users

The 3 approved, non-seed stories with `image_url = null`:

- `cbf9224e-6ac7-489f-a825-7f8b5c3f9e48`
- `3f5e5c01-591c-4431-9352-f4bfbc4d5061`
- `255d7727-05fd-40b6-b609-9334d99aff77`

## What to build

### 1. New edge function: `send-repost-request-email`

Admin-only (uses existing `authenticateRequest` + `requireAdmin` helpers, same pattern as `send-approval-email`).

Flow:

1. Accept `{ userIds: string[] }` (or no body = default to the 3 known users).
2. For each user:
  - Look up their auth email via service-role `auth.admin.getUserById` (same approach as `get-user-email`).
  - Look up their `anonymous_username` from `profiles`.
  - Call the **UX Copy Agent** (Lovable AI Gateway, `google/gemini-2.5-flash`) with a system prompt describing Juice's voice (anonymous, men-only, direct, warm, no fluff) and ask for:
    - subject line
    - 2–3 sentences explaining: photos are now required, their existing story is still live but they're encouraged to repost with a photo so it has more impact, link back to the app.
  - Return structured JSON via AI SDK `Output.object` so we get `{ subject, bodyParagraphs[] }` reliably.
  - Render into the existing Juice email HTML template (reuse the visual style from `send-approval-email`) with the AI-generated copy + a "Repost your story" CTA linking to `https://sipjuice.app/app`.
  - Send via Resend (`RESEND_API_KEY` already configured).
3. Return per-user `{ userId, status: 'sent' | 'failed', error? }`.

### 2. Admin UI trigger

Small button on `src/pages/AdminPosts.tsx` (admin-only): **"Email posters without photos"**.

- Queries `stories` where `is_seed = false AND image_url IS NULL`.
- Shows the count + list of usernames in a confirm dialog.
- On confirm, invokes `send-repost-request-email` with those user IDs.
- Toasts the per-user result.

### 3. Safety

- Idempotent-ish: log to `security_audit_logs` (`action = 'repost_request_email_sent'`, `resource_id = userId`) so we don't accidentally spam — admin sees a warning if a user was already emailed in the last 7 days but can override.
- No retention of email address beyond the function call (matches the project's phone-retention rule).

## Technical details

- Uses `LOVABLE_API_KEY` (already set) → AI Gateway → `google/gemini-2.5-flash` (cheap, fast, good copy).
- Uses `RESEND_API_KEY` (already set), `from: "Juice <noreply@sipjuice.app>"`.
- New file: `supabase/functions/send-repost-request-email/index.ts`.
- Edit: `src/pages/AdminPosts.tsx` to add the trigger button + dialog.
- No DB schema changes.

## Out of scope

- Bulk/marketing sends to the wider user base.
- Forcing deletion of the 3 existing photo-less stories (they stay live unless you want me to also hide/unapprove them — say the word and I'll add that).