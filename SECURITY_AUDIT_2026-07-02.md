# Juice Security Audit — 2026-07-02

Scope: verification gate, admin authorization, RLS coverage (all 26 tables), 21 edge functions, storage buckets, DB hygiene. Live DB (`mccehajzdnpkpusffhco`) + codebase. **No fixes applied — proposals only.**

## Verdict: no P0, no P1. The core invariant holds.

Only verified men can read real member content; only admins reach admin surfaces. Confirmed at the DB boundary, not just the UI.

## SOLID ✅

- **Verification gate**: `is_user_verified()` is SECURITY DEFINER + pinned `search_path`, checks `verification_status='approved'`. `stories`, `comments`, and `reactions` all gate SELECT on verification (the 2026-06-29 gap is still fixed). Real-post reads additionally require `status='approved'`.
- **Self-verification blocked**: owners can UPDATE their verification row only while `verification_status <> 'approved'` — a user cannot approve himself. Approval audit trigger present.
- **Admin authorization**: `has_role()` is a pure `user_roles` lookup — no email backdoor, no hardcoded admin anywhere in the client (grep clean). Escalation blocked by admin-only write policies **plus** `prevent_self_role_modification_trigger` and two audit triggers.
- **RLS coverage**: all 26 tables have RLS on. Zero `USING (true)` reads except reference data (`cities`, `codenames`). `profiles` (phone, DOB) readable by owner/admin only. `app_secrets` / `email_optouts` have no policies = service-role only, intended.
- **Edge functions (21)**: destructive fns (`delete-account`, `admin-delete-user`, `delete-verification-selfie`) validate the JWT via `getUser`/shared `authenticateRequest`; admin-delete additionally checks `has_role('admin')`. All AI/paid-API fns (`competitive-*`, `viral-*`, `*-generator`) call `requireAdmin()`. Cron fns gated by vault secrets (`x-sweep-secret`, `broadcast_secret`, `signup_secret`). No denial-of-wallet or IDOR paths found.
- **Storage**: `verification-selfies` and `story-images` private; only marketing buckets (`landing-assets`, `landing-assets-v2`) public — intended.
- **Hygiene**: zero SECURITY DEFINER functions with mutable search_path; zero security-definer views; content-validation + moderation-protection + status-forcing triggers on `stories`.

## P2 — hardening (recommended, not urgent)

**P2-1: Anonymous story inserts have no DB-level rate limit.**
The `anon` role can INSERT pending stories (correctly forced to `status='pending'`, `user_id IS NULL`, `is_seed=false`, content-validated). But nothing at the DB layer throttles volume — a script could queue thousands of pending posts and bury the moderation queue. Proposed fix (do not apply without approval):

```sql
create or replace function public.check_anon_story_rate()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null and new.submitted_anonymously then
    if (select count(*) from public.stories
        where submitted_anonymously and user_id is null
          and created_at > now() - interval '1 hour') >= 30 then
      raise exception 'Anonymous submissions are temporarily paused. Please try again later.';
    end if;
  end if;
  return new;
end $$;

create trigger trg_anon_story_rate before insert on public.stories
for each row execute function public.check_anon_story_rate();
```
(Global cap, since anon has no stable identity at the DB layer; per-IP limiting would go in an edge function in front.)

**P2-2: Auth dashboard settings (manual check — not queryable via SQL).**
In Supabase Dashboard → Authentication: enable leaked-password protection, review OTP expiry (≤1 hour), consider MFA options for admin accounts. Five minutes of clicking; do it before store submission.

## P3 — cleanup

**P3-1: `pg_net` extension lives in the `public` schema.** Standard Supabase advisory; move to its own schema when convenient (`alter extension pg_net set schema extensions;` — verify the signup trigger still fires afterward).

## Self-serve verification test

1. Create a fresh account, don't verify → app should show only seed stories; in SQL, impersonating that user must return 0 real approved stories.
2. As that user, try `update user_verifications set verification_status='approved'` → must fail.
3. Try `insert into user_roles (user_id, role) values ('<your-uuid>','admin')` → must fail.
4. Call `competitive-analysis` with a non-admin JWT → 403.

---
*Audit method: policy + WITH CHECK inspection via pg_policies, trigger census, function-definition review, edge-function source review, bucket flags. Advisor auth items in P2-2 require dashboard access.*
