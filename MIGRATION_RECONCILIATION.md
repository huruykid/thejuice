# Migration Reconciliation — repo ↔ prod (theJuice `mccehajzdnpkpusffhco`)

_Generated 2026-06-24. Goal: make the repo migration history match what prod actually has, so the upcoming P0-3 `db push` can't double-apply, error, or assume missing state._

## What was wrong

The repo (Lovable-style filenames) and prod's `supabase_migrations.schema_migrations` had drifted **both directions**:

1. **7 migrations existed in prod but had NO repo file** — including real schema (`bookmarks` table, `profiles.referral_source`, the entire story post-approval/moderation model, a 2026-06 security-hardening pass). If anyone rebuilt from the repo, this would be silently lost.
2. **3 repo files were never applied to prod** under their own version (`push_tokens`, `dispute_requests`, `fix_dispute_rls`). The features were dead in prod until they were created on 2026-06-24. `20260624000002` also contained a **broken** admin RLS policy (`profiles.role`, a non-existent column) that would **error** on `db push`.
3. **2 repo files were applied to prod under different version numbers** (the P0-2 anon lockdowns), so `db push` would try to re-run them.

## What was fixed in the repo (this session)

- **Added 7 catch-up files** recreating the prod-only migrations (versions already in prod's table, so `db push` auto-skips them):
  `20260620224254_security_hardening_2026_06`, `20260620224342_revoke_execute_trigger_fns_from_public`, `20260621200955_stories_post_approval_model`, `20260621201034_protect_story_moderation_fields`, `20260624053021_add_referral_source_to_profiles`, `20260624065510_create_bookmarks_table`, `20260624165804_backfill_comments_profile_id`.
- **Rewrote `20260624000001_push_tokens.sql` and `20260624000002_dispute_requests.sql`** to be correct + idempotent (fixed the broken `profiles.role` policy, added `DROP POLICY IF EXISTS` guards) so a stray `db push` can never error. `20260624000003_fix_dispute_rls.sql` was already idempotent.

## What prod actually has (applied via connector this session)

| Prod version | Name | Repo equivalent |
|---|---|---|
| 20260624214223 | revoke_anon_stories_select | `20260624120000_revoke_anon_stories_select.sql` |
| 20260624214417 | least_privilege_anon_grants | `20260624120001_least_privilege_anon_grants.sql` |
| 20260624215830 | create_push_tokens | `20260624000001_push_tokens.sql` |
| 20260624215840 | create_dispute_requests | `20260624000002_dispute_requests.sql` |
| 20260624215918 | least_privilege_new_tables | (folded into `000002` grants above) |

## Remaining steps — RUN THESE LOCALLY (need linked Supabase CLI + git)

These can't be done from the connector; do them on a machine with `supabase` linked to `mccehajzdnpkpusffhco`.

1. **Untrack the committed env file** (history checked — only the public anon key was ever in it, no service-role key):
   ```bash
   git rm --cached .env
   echo ".env" >> .gitignore   # already present; confirm
   git commit -m "stop tracking .env"
   ```

2. **Tell the CLI the already-applied repo files are applied** (so the next `db push` skips them and runs ONLY the staged P0-3 migration):
   ```bash
   supabase migration repair --status applied \
     20260624000001 20260624000002 20260624000003 \
     20260624120000 20260624120001
   ```

3. **Confirm the only pending migration is the staged P0-3 one:**
   ```bash
   supabase migration list   # 20260624120200_private_story_images should be the only un-applied repo file
   ```

4. **Deploy frontend FIRST, then apply P0-3** (see AUDIT_FIX_PLAN.md P0-3 — order is load-bearing):
   ```bash
   # after the signed-URL frontend is live in prod:
   supabase db push          # applies 20260624120200_private_story_images.sql
   ```

5. **Redeploy the edge function** to make the P0-1 IDOR fix live:
   ```bash
   supabase functions deploy send-push-notification
   ```

## Root cause to fix separately (PM queue item #2)

A schema `ALTER DEFAULT PRIVILEGES` rule auto-grants ALL to `anon` on every new table — which is why each new table re-inherited anon write grants and needed a manual revoke. Fix the default-privilege rule so future tables are clean by default. (Not exploitable today; RLS holds.)
