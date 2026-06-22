# Post-to-Unlock + Seeded Celebrity Feed

## The mechanic in one paragraph

Two doors. **Account approval** lets you in. **Post approval** unlocks the real feed. Until a user has one approved post, they only see a curated "seed" feed of celebrity rumor posts (Jada Pinkett, etc.). Even after they have an approved post, I want to do a mass 'real feed' approval process. This way, we can ensure the approved users will come to a full feed. Anonymous (logged-out) visitors can submit a post too — once approved that post is now apart of the 'real feed', and they're nudged into the full account approval flow if they want their own feed access.  


## User states


| State                              | Can post?            | Sees in feed                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------- |
| Anonymous visitor                  | Yes (pending review) | Marketing pages only                                           |
| Anon post approved                 | —                    | Prompt to create account for feed access                       |
| Account pending approval           | No                   | Locked screen                                                  |
| Account approved, 0 approved posts | Yes                  | **Seed feed only** (celebrity posts) + "Post to unlock" banner |
| Account approved, ≥1 approved post | Yes                  | Full community feed                                            |
| Account approved, post rejected    | Yes (retry)          | Seed feed + denial message + 24h cooldown                      |


## What gets built

### 1. Seed feed (celebrity rumor posts)

- New `is_seed` boolean on `stories` (default false), and an admin-only `seed_posts` flag visible everywhere a user has no approved post of their own.
- I write 20 posts as a seed-author account: codename = celebrity name, content = "what users have read / the rumors," tagged `#seed`. Subject phone left null.
- Seed posts always render in the feed for unlocked-account-but-no-post users; they're hidden (or de-prioritized) once the user has their own approved post.

### 2. Post-to-unlock gate

- Home/feed checks: does this user have ≥1 row in `stories` with `status='approved'` and `is_seed=false`?
- If no → show seed feed + persistent "Create your first post to unlock the community" CTA.
- If yes → show normal community feed.

### 3. Anonymous posting path

- New route `/share` (or similar) — public, no auth required.
- Form collects: codename, content, the 4 ratings, optional email for notification on approval.
- Submitted posts land in admin queue with `submitted_anonymously=true`.
- On approval: if email given, send "your post is live — want full access? create an account" link.

### 4. Safety guardrails (non-negotiable)

- Posting form (anon and logged-in) shows a short, plain-language acknowledgment checkbox: "I'm sharing a real experience. I won't fabricate, exaggerate, or include details to identify someone publicly (last names, photos, addresses, workplaces)." Must be checked to submit.
- Subject phone is **optional** on the unlock post (not required to submit).
- 24h cooldown after a rejected post before resubmit. Min content length 150 chars.

### 5. Denial message flow

- Admin can attach one of a few canned reasons on rejection (e.g. "names a real person identifiably", "low effort", "appears fabricated", "violates guidelines").
- User sees a polite screen: "Your post wasn't approved. Reason: {reason}. You can post again in 24 hours."
- Same UX for rejected anon posts (via email if provided).

### 6. Admin queue improvements (lightweight)

- Single combined queue view: account verifications + pending posts in one list, sortable by waiting time.
- Bulk approve/reject buttons. One-click "approve + send approval email" combo.

## What is intentionally NOT in this pass

- Teaser/blurred community feed (seed feed replaces it — cleaner and gives us content control).
- Removing selfie verification — keeping both gates for now since you confirmed account approval is still required. We can revisit if the queue becomes the bottleneck.
- Auto-approve heuristics.

## Technical details

**Migration**

- `ALTER TABLE stories ADD COLUMN is_seed boolean NOT NULL DEFAULT false;`
- `ALTER TABLE stories ADD COLUMN submitted_anonymously boolean NOT NULL DEFAULT false;`
- `ALTER TABLE stories ADD COLUMN rejection_reason text;`
- `ALTER TABLE stories ADD COLUMN rejected_at timestamptz;`
- `ALTER TABLE stories ADD COLUMN anon_contact_email text;` (nullable, for anon notification only — deleted on approval per privacy policy)
- New function `public.user_has_approved_post(_user_id uuid) returns boolean` — security definer.
- RLS update on `stories` SELECT: a user can read non-seed approved posts only if `user_has_approved_post(auth.uid())` returns true, OR the row is their own, OR `is_seed=true`.
- Seed posts: GRANT SELECT to `anon` is NOT added — only authenticated approved users see them.
- Anonymous insert policy: allow `INSERT` to `anon` role when `submitted_anonymously=true` AND `status='pending'` AND `user_id IS NULL`. Rate-limited via existing `check_rate_limit`.

**Frontend**

- New hook `useHasApprovedPost()` — single query, cached.
- `Home.tsx` / `UnverifiedHome.tsx` branches on the hook + verification state to pick feed source.
- New `<UnlockBanner />` component shown above the seed feed.
- New `/share` public page reusing `CreateStory` form components in anonymous mode.
- New `<PostRejected />` component shown on next login after rejection.
- New admin queue page combining verifications + post moderation.

**Seed content**

- I'll write the 20 celebrity-rumor posts as a one-time `supabase--insert` once you confirm the format. Suggested format: codename = "Jada P.", content = "Rumor mill says…", ratings filled in plausibly, `is_seed=true`, `status='approved'`, `user_id` = a dedicated `seed-author` profile.

## Open questions before build

1. Who's the seed author profile? Want me to create a dedicated `juice_editorial` account, or attribute to your admin account?
2. Should the 20 seed posts stay visible forever (mixed into the community feed) or disappear once a user has their own approved post? My recommendation: **disappear** — keeps the community feed authentic and gives "I'm in" a meaningful moment.
3. Anon contact email — store it (deleted on approval) or skip email notification entirely and just show a "check back" page? Per project memory, we avoid retaining contact details, so I'd lean **skip email**.