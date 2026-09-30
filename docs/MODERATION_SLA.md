# Juice Moderation & Takedown Runbook

> **OPERATIONAL DRAFT. NOT LEGAL ADVICE.** This is an internal process draft written
> from the current codebase (2026-09-30). It has **not** been reviewed by an attorney.
> Before launch, a licensed attorney must review it, in particular the CSAM/NCMEC
> section (18 U.S.C. § 2258A), evidence retention, law-enforcement requests, and any
> commitment made here to users or App Review.
> Status: DRAFT, pending attorney review. Owner: founder (see "On call").

Covers Apple App Review Guideline 1.2 (user-generated content needs a way to filter
objectionable material, report it, block abusive users, and act on reports quickly, plus
published contact information) and the moderation line items in `LEGAL_COUNSEL_CHECKLIST.md`.

---

## 1. Service levels

| Queue item | Target first action | Target resolution |
|---|---|---|
| CSAM, sexual content involving a minor, any content about a person under 18 | **Immediately** (within 1 hour of seeing it) | Same day: removed, preserved, reported, account suspended (§4) |
| Credible threat of violence or self-harm | Within 1 hour | Same day (§5) |
| Doxxing (phone, address, workplace, socials, photos of a private person's face or ID) | Within 12 hours | Within 24 hours (§5) |
| Any other in-app report (`reports` table) | **Within 24 hours** | Within 24 hours where possible, 72 hours at most |
| Removal request from a subject (`/dispute`) | Within 24 hours | Within 72 hours; email the requester with the outcome |
| New story awaiting approval (pre-moderation) | Within 24 hours | Approve or reject |

"First action" means a human has looked at the item and either resolved it or hidden the
content while deciding. **When in doubt, hide first, decide second.**

## 2. What exists today (from the code)

### Prevention
- **Every member story is pre-moderated.** The `trg_set_story_initial_status` trigger
  (`set_story_initial_status()`) forces each non-seed story to `status = 'pending'`. Nothing
  is shown to other members until an admin approves it in **/admin/posts**
  (`src/pages/AdminPosts.tsx`). Approve, reject (with reason) and delete are available there,
  plus a "request repost" email (`send-repost-request-email`).
- Stories are readable only by verified members (`is_user_verified()` in RLS). Logged-out
  visitors cannot read stories.
- Membership requires selfie verification, reviewed at **/admin/verifications**.
- Anonymous submissions are capped at 30 per hour site-wide (`check_anon_story_rate`), and
  story creation is rate limited per user (`check_rate_limit('story_create')`).
- The Terms (`/terms`, `src/pages/Terms.tsx`) already ban content about anyone under 18,
  state that minors' accounts are removed, and say illegal content is "removed immediately
  and reported to the appropriate authorities". This runbook is how we keep that promise.

### Report (members)
- `ReportContentDialog` (`src/components/ReportContentDialog.tsx`) lets a member report a
  **story, comment or user**. Reasons: harassment, hate speech, spam, inappropriate,
  violence/threats, false information, other, plus free-text details.
- Reports land in `public.reports` (`status`: pending → reviewing → action_taken | dismissed,
  with `reviewed_by`, `reviewed_at`, `action_taken`).
- Admin queue: **/admin/reports** (`src/pages/AdminReports.tsx`). It shows the reported
  story text or profile and has Review / Action taken / Dismiss buttons.
- **Important:** "Action taken" only changes the report status. It does **not** remove
  anything. Remove the content in /admin/posts (or suspend the user, §6) **before** marking
  the report as actioned.

### Block (members)
- `BlockUserDialog` writes to `public.user_blocks`. Blocked authors are filtered from the
  blocker's feed (`useBlockedUserIds`), and RLS (`is_blocked()`) stops blocked users from
  commenting or reacting on each other's stories. Blocks are instant and need no admin.

### Dispute / takedown (anyone, no account)
- **/dispute** (`src/pages/DisputeRequest.tsx`) is public and linked from the Terms. Fields:
  the name used in the story, contact email, reason ("This story is false", "I am not this
  person", "This contains private information I did not consent to share", "Other"), and
  details. It can be pre-filled with `?name=`. Submissions are rate limited
  (`check_rate_limit('dispute_submit')` in the insert policy).
- Rows land in `public.dispute_requests`. Admin queue: **/admin/disputes**
  (`src/pages/AdminDisputes.tsx`).
  - **Approve** permanently deletes the linked story (`useResolveDispute` in
    `src/hooks/useDisputes.ts`) and marks the request approved. This cannot be undone.
  - **Reject** records admin notes and marks the request rejected.
- The app does **not** email the requester automatically. Reply manually from
  support@sipjuice.app.

### Enforcement tools
- Suspensions: `public.user_suspensions` (`user_id`, `reason`, `expires_at`, `revoked_at`).
  `is_user_suspended()` blocks posting, commenting and reacting in RLS. **There is no admin UI
  for this yet.** Insert rows through the Supabase dashboard (see §6).
- Account deletion: **/admin/verifications** calls the `admin-delete-user` edge function
  (admin-checked, service role, writes to `security_audit_logs`).
- Audit trail: `security_audit_logs` (admin-readable).

### Known gaps (fix before or soon after launch)
1. **No alerting.** Nothing notifies an admin when a report or dispute arrives (no trigger on
   `reports` or `dispute_requests`). To meet the 24-hour SLA, the on-call person must check
   the queues on a schedule (§7) until an alert exists. Recommended: a trigger or edge function
   that emails or pushes to the on-call admin, following the `new-signup-alert` pattern.
2. **No report reasons for minors, sexual content, doxxing or private information.** Add
   "Involves someone under 18", "Sexual or explicit content" and "Shares private
   information (doxxing)" to `REPORT_REASONS` and sort those first in /admin/reports.
3. **No suspension or ban UI.** Suspending takes a manual SQL insert.
4. **"Action taken" does not act.** Consider wiring it to hide the target story.
5. **No evidence-preservation tooling.** Approving a dispute or deleting a story deletes the
   row. For CSAM or threats, follow §4 and §5 **instead** of those buttons.
6. No automated email to dispute requesters.

## 3. Daily triage order

1. /admin/reports: filter **Pending**, sort **Oldest**. Scan for minors, sexual content,
   threats and doxxing first.
2. /admin/disputes: pending requests, oldest first.
3. /admin/posts: pending stories. Pre-moderation is the main line of defense. Reject
   anything that would fail §4 or §5.
4. /admin/verifications: pending selfies. Reject and escalate any selfie that appears to show
   a minor (§4).

Decision guide for a story (report or dispute):

- Names or identifies someone under 18, or sexualizes anyone who might be a minor → §4.
- Threats, incitement or self-harm → §5.
- Doxxing (full name plus phone, address, workplace, socials, or identifying photos) → §5.
- The subject disputes the story and it contains private information, identifies them beyond
  a first name and city, or makes a factual allegation of a crime → **approve the takedown.**
  We are not the fact-finder, and the default for a real person's dispute is removal.
- Opinion about the poster's own dating experience that is not identifying and not an
  allegation of a crime → reject the dispute with a note. Record the reasoning in
  `admin_notes`. Escalate to counsel when unsure.

## 4. CSAM and minor-safety escalation (highest priority)

Covers any image or text that sexualizes a minor, any content about a person who appears to
be under 18, and any member who appears to be a minor.

**Do not investigate the material yourself.**

1. **Stop viewing.** Do not open, download, screenshot, forward, re-share or show the content
   to anyone, including co-workers, except as counsel directs. Do not copy it to a personal
   device.
2. **Remove it from view without destroying it.** In /admin/posts, **reject** the story
   (status `rejected`); do not delete it. For a storage image, do not delete the object.
   Record the story id, author `user_id`, storage path, and timestamps.
3. **Preserve.** Leave the database row and storage object in place, access-restricted, and
   write down what was preserved and when in `security_audit_logs` or a restricted incident
   note. U.S. law requires providers to preserve the contents of a report for a set period
   after submission (currently one year under 18 U.S.C. § 2258A(h); **confirm the current
   period and handling with counsel**). Do not run the dispute "Approve" button, the story
   delete, `selfie-sweep`, or account deletion on this material until counsel clears it.
4. **Report to the NCMEC CyberTipline** (https://report.cybertip.org) as soon as reasonably
   possible, and never later than the law requires. Include the account identifiers, upload
   time, IP addresses you hold, and the preserved file references. Record the CyberTipline
   report number with the incident.
5. **Suspend the account** at once (§6, no expiry) so the user cannot post again. Do not
   warn or tip off the user about the report.
6. **If a child may be in imminent danger,** call 911 or local law enforcement as well.
7. **Tell counsel the same day.** Counsel handles any law-enforcement preservation request or
   legal process.
8. **Selfie that appears to show a minor:** reject the verification, suspend the account and
   escalate to counsel. If the selfie itself is sexual, treat it as CSAM (steps 1 to 7).

## 5. Doxxing, threats and harassment

**Doxxing** (phone numbers, addresses, workplaces, social handles, license plates, or photos
that identify a private person):
1. Reject or hide the story at once (within the §1 SLA).
2. If the story has other value, ask the author to repost it without the identifying details
   (the "request repost" email in /admin/posts). Otherwise, reject it.
3. First offense: a warning, sent from support@sipjuice.app and logged. A deliberate or
   repeat offense: suspend (§6).
4. If the subject filed a dispute, approve it and reply to them.

**Threats of violence and incitement:**
1. Hide the content immediately and preserve it (reject, do not delete).
2. Suspend the author (§6).
3. If there is a specific, credible threat to someone's safety, contact local law enforcement
   (911 for an imminent threat). Log what was shared and with whom. Tell counsel.

**Self-harm:** hide the content and send the author crisis resources (988 in the U.S.). Do
not suspend for self-harm alone.

**Harassment and brigading** (repeated posts about the same person, coordinated attacks):
treat as a repeat offense under §6, even if each post alone looks borderline.

## 6. Repeat offenders and bans

Every enforcement action goes into `user_suspensions` (for suspensions) or the report's
`action_taken` text, with a reason naming the policy broken.

| Strike | Typical trigger | Action |
|---|---|---|
| 1 | Minor violation (identifying details, rude comment) | Remove content, warn by email |
| 2 | Second violation within 90 days | 7-day suspension |
| 3 | Third violation, or any doxxing or harassment campaign | 30-day suspension |
| Ban | Fourth violation, any credible threat, ban evasion, or any §4 content | Permanent suspension (`expires_at` NULL), then account deletion **after** counsel clears any §4 or §5 preservation hold |

Manual suspension until a UI exists (Supabase dashboard, SQL editor, by an admin):

```sql
insert into public.user_suspensions (user_id, reason, created_by, expires_at)
values ('<user uuid>', '<policy + report id>', '<your admin uuid>', now() + interval '7 days');
-- permanent ban: expires_at => null
-- lift early: update public.user_suspensions set revoked_at = now(), revoked_by = '<admin uuid>' where id = '<id>';
```

Ban evasion: new accounts need a fresh selfie verification, which slows evasion down, but
approved selfies are deleted (`delete-verification-selfie`, `selfie-sweep`), so there is
nothing to compare against later. Watch for the same writing style and the same subjects from
new accounts. A durable ban signal (for example, a hashed email or device identifier on the
suspension) is an open gap.

## 7. On call

| Role | Who | Responsibility |
|---|---|---|
| Primary moderator | **Founder (TBD: name, phone)** | Checks queues at least twice a day (morning and evening); owns the §1 SLAs |
| Backup moderator | **TBD** (must exist before launch) | Covers when the primary is away more than 12 hours |
| Legal escalation | **Outside counsel (TBD: name, email, phone)** | §4, §5, subpoenas, law-enforcement requests, contested disputes |
| Contact channel | support@sipjuice.app (published in /terms) | Monitored daily by the primary |

Hand off explicitly when unavailable. The 24-hour SLA runs every day, weekends included.

## 8. Records and review

- Keep reports, disputes and suspensions (do not hard-delete them) so repeat offenders can be
  tracked and actions can be explained.
- Monthly: count reports received, median time to first action, disputes approved and
  rejected, suspensions, and NCMEC reports. Use these numbers in any transparency report and
  in replies to App Review.
- Revisit this runbook after the first 30 days of real volume, and after any §4 or §5
  incident.
