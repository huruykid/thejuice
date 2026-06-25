# Juice — Audit Fix Plan

_Prioritized remediation plan from the code, security, and design audit (2026-06-24)._

## Implementation status (2026-06-24)

- **P0-1 — DONE (applied in repo).** `send-push-notification` now derives recipient + content server-side; client wrapper + both callers updated. `tsc` clean.
- **P0-2 — DONE & APPLIED to prod (`theJuice`).** Migration `20260624120000_revoke_anon_stories_select.sql` applied via the Supabase connector. Revoked anon `SELECT` on `stories`, scoped the seed policy to authenticated. Verified: anon now has INSERT only. Note: `subject_phone` was **already dropped** in `20250822175548`, so the live exposure was `subject_name` / `image_url` / `user_id` on seed rows, not phone.
- **P0-2b — NEW finding, DONE & APPLIED to prod.** Discovered while verifying P0-2: the anon role held `DELETE/UPDATE/TRUNCATE/TRIGGER/REFERENCES` on **every** public table (incl. `user_roles`, `user_verifications`). Not exploitable today (RLS is enabled on all 21 tables and every write policy requires `auth.uid()`/admin; TRUNCATE isn't exposed via PostgREST) but a least-privilege violation. Migration `20260624120001_least_privilege_anon_grants.sql` revokes all write verbs from anon across public tables. Verified: 0 anon write grants remain.
- **P0-3 — Client pipeline DONE (in repo); bucket migration STAGED, deliberately NOT applied to prod.** Implemented: uploads store object paths (`CreateStory/index.tsx`), a backward-compatible signed-URL resolver (`src/hooks/useStoryImageUrls.ts`), and StoryCard now renders signed URLs. `tsc` clean. The bucket flip lives at `supabase/migrations/20260624120200_private_story_images.sql` — **apply it right after the frontend deploys**, not before, or live `<img>` URLs 404. (The `.PENDING` file is superseded.)

- **P0-2c — NEW, DONE & APPLIED to prod.** Prod was **3 migrations behind the repo**: `push_tokens`, `dispute_requests`, and the dispute-RLS fix had never been applied. So the push feature (the P0-1 fix) had no `push_tokens` table, and the entire dispute/takedown feature had no table — the public `/dispute` form was non-functional in prod. Created both tables with corrected admin RLS (`current_user_has_role`, not the non-existent `profiles.role`) and least-privilege grants (anon: INSERT-only on disputes, nothing on push_tokens). Verified.
- **ROOT-CAUSE — DONE & APPLIED to prod.** The stock Supabase default-privilege rule granted anon = `arwdDxtm` (ALL) on every new `postgres`-created table — the reason new tables re-inherited anon write grants. Fixed via `20260624220000_default_privileges_anon_least_privilege.sql`: new migration-created tables now give anon only SELECT/INSERT by default. Verified (anon default is now `arm`). **Residual:** the `supabase_admin` default-privilege path (dashboard-created tables) couldn't be changed from the connector ("permission denied"); documented in the migration for a dashboard-side fix if ever needed.
- **MIGRATION DRIFT — DONE (repo reconciled; see `MIGRATION_RECONCILIATION.md`).** Added 7 catch-up files for prod-only migrations, fixed the broken/superseded `push_tokens`/`dispute_requests` repo files. Remaining local steps (git rm --cached .env, `supabase migration repair`, deploy order) are in the runbook.
- **P3-3 button contrast — DONE (repo).** `default`/`gradient`/`juice`/`juice-outline` now use `text-primary-foreground` instead of `text-white` on the amber gradient. Ships with next frontend deploy.
- **P3-1 / P3-2 flag accessibility — DONE (repo).** Red flag = `Flag` icon, green flag = `CheckCircle2` icon (distinct SHAPES, not just color); inactive opacity 0.45→0.7; flag/comment/bookmark tap targets bumped to ≥44px; `aria-pressed` added. Ships with next frontend deploy.
- **P1-5 failing test — DONE (repo).** `validateTag` regex now allows emoji + variation selectors + ZWJ. Suite green: 150/150.
- **P1-2 dead security utilities — DONE (repo).** Wired the (now hardened, server-side) `check_rate_limit` into the story-create path (`useStories.useCreateStory`, action `story_create`); labeled `moderateContent` as advisory-only (not a boundary).
- **P1-4 `(supabase as any)` casts — DONE (repo).** Regenerated `types.ts` from prod (now includes `dispute_requests`/`push_tokens`/`bookmarks` etc.), removed all 41 casts across 16 files. Lint errors 132→92; `no-explicit-any` 115→76 (remainder are unrelated `catch(err:any)`).
- **TOOLING DISCOVERY — important.** The repo's `tsc --noEmit` was checking **nothing**: root `tsconfig.json` is a solution file (`files: []`), so type errors in `src` never surfaced and never blocked `vite build`. Added a real `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`). It revealed 3 latent errors — fixed 2 (a de-cast regression in `StoryDetail`, a `setQueryData<boolean>` typing in `ReferralPrompt`). **1 remains:** `@capacitor/push-notifications` is in package.json but not installed → `Cannot find module`. Resolves on `npm/bun install` or via the P2-4 Capacitor v6→v7 fix. Recommend adding `npm run typecheck` to CI.
- **P1-3 strictNullChecks — ASSESSED & DEFERRED (per PM time-box).** Enabling it surfaces ~17 null/undefined errors (mostly `string | null` vs the hand-written `Story`/`UserBlock` interfaces' `string | undefined`), and a fully-green strict build is also blocked by the missing-Capacitor-module error. This is the bounded-but-real "L"; do it as a focused pass bundled with P2-4 (install/bump Capacitor), reconciling the `Story` interface with the generated row types. Flag left OFF to keep the build stable.
- **NEW finding — `subject_phone` still live in prod.** The repo's drop migration (`20250822175548`) never reached prod, so real subject phone numbers are still collected (`CreateStory`→`useCreateStory`) and stored. They were anon-readable until P0-2. Decide: drop the column + scrub existing data (matches the repo's evident intent) vs. keep the feature. Destructive + a product call — not done autonomously.
- **P1-1 rate-limit keying — DONE & APPLIED to prod.** `check_rate_limit` rewritten: limits are server-side per action_type, bucket key derived from `auth.uid()` (JWT) or proxy client IP — caller's `p_identifier`/limits ignored. Verified by smoke test (two different client identifiers collapsed to one bucket). `20260624221000_harden_check_rate_limit.sql`. Client call-site annotated.
- **P2-1 route code-splitting — DONE (repo).** `App.tsx`: all routes except the entry pages (Landing, Index) are now `React.lazy` behind a `<Suspense>` boundary. Admin, marketing/SEO, blog, recharts-heavy pages no longer ship in the initial bundle. typecheck clean.
- **P2-2 feed memoization — DONE (repo, partial).** `StoryCard` wrapped in `React.memo`; Home passes only stable props, so cards no longer re-render en masse as pages load. **Follow-up:** the N+1 (each card fires its own reaction/bookmark/verification queries) still stands — batching those into the feed query is a larger reshape best done with runtime testing.
- **P2-4 Capacitor deps — DONE (repo; needs install).** `@capacitor/push-notifications` bumped `^6`→`^7` (matches core 7.4.2); unused `@capacitor-community/privacy-screen` removed (only `@capacitor/privacy-screen` is imported). Run `npm/bun install` to update node_modules + lockfile — this also clears the lone remaining `typecheck` error.
- **P2-5 debug logs — DONE (repo).** Removed 8 debug `console.log`s (useCameraCapture, useAuth welcome-email, AutomatedCampaignDashboard). Legit `console.error` handlers kept. **Follow-up:** comprehensive user-facing error toasts on swallowed mutation paths — best done with runtime testing; intentional silent failures (geolocation denial) left as-is.
- **P3-4 token palette — DONE (repo).** `--destructive` is now a real red (light `0 72% 51%`, dark `0 72% 56%`, white foreground) instead of collapsing to amber — so destructive toasts/buttons read as warnings. Story flags now pull from tokens (`hsl(var(--destructive))` / `hsl(var(--success))`) instead of hardcoded hex, so they theme correctly. **Skipped:** pruning the `--juice-pink/purple/blue/lavender` aliases — they're still referenced (e.g. `juice-soft` button uses `bg-juice-lavender`), so removing them needs a usage sweep; low value, deferred.
- **P3-5 footer/stats — PARTIAL (repo) + 2 flagged decisions.** Added the **"Request story removal"** (`/dispute`) link to the Landing footer — the legally-relevant mechanism was previously buried. **Decisions left to you:** (1) a real **Terms of Service** needs a `/terms` page with legal content (didn't fabricate it / avoided a dead link); (2) the hardcoded "1,200+ verified men / 3,400+ stories" — annotated in code with how to wire a `get_public_stats()` RPC, but left as-is since showing real (possibly small) counts is a marketing call.

### Other issue surfaced (not yet fixed)
- **`subjectPhone` still passed in the CreateStory payload** (`CreateStory/index.tsx`) though the column was dropped — dead field, confirm the mutation ignores it.

Priority order: do **P0** before anything else ships, **P1** this week, **P2/P3** as you have capacity. Each item lists the file, the problem, and the exact change.

---

## P0 — Critical (privacy & security, do first)

These three undermine the app's core promise that subjects' PII stays private. They are exploitable through the public REST API, not just the UI.

### P0-1 · Push-notification IDOR
**File:** `supabase/functions/send-push-notification/index.ts` (~line 64)
**Problem:** The function authenticates the caller but never checks that the caller _is_ the target. It takes `userId` from the request body and uses the **service-role key** to push attacker-controlled `title`/`body`/`data` to any user — targeted phishing + deep-link injection.

**Fix:** Require the target to be the caller, _or_ gate it to admins / a trusted server secret. Minimal version — only let a user notify themselves:

```ts
const auth = await authenticateRequest(req);
if (auth instanceof Response) return auth;

const { userId, title, body, data }: SendPushRequest = await req.json();

if (!userId || !title || !body) {
  return createSecureErrorResponse("Missing required fields: userId, title, body", 400);
}

// NEW: prevent sending to arbitrary users
if (userId !== auth.userId) {
  // allow only if the caller is an admin
  const isAdmin = await callerIsAdmin(auth.userId); // reuse your existing admin check
  if (!isAdmin) {
    return createSecureErrorResponse("Forbidden", 403);
  }
}
```

In practice most pushes are server-triggered (reaction/comment fan-out). The cleaner long-term fix is to move sending fully server-side and require a shared-secret header (`X-Internal-Secret`) for any cross-user send, so no client JWT can trigger it at all.

---

### P0-2 · `subject_phone` / `subject_name` readable by anonymous users
**File:** `supabase/migrations/…_seed-posts-policy.sql` (the "Seed posts viewable by anyone" policy + `GRANT SELECT … ON public.stories TO anon`)
**Problem:** The grant is table-wide, all columns. Anyone with the public anon key can call
`GET /rest/v1/stories?is_seed=eq.true&status=eq.approved&select=subject_name,subject_phone,image_url`
and harvest names and phone numbers of real people. RLS is row-level only; there is no column restriction.

**Fix:** Stop exposing the base table to `anon`. Serve seed posts through a view that omits sensitive columns.

```sql
-- 1. Revoke the broad anon grant on the base table
REVOKE SELECT ON public.stories FROM anon;

-- 2. Create a sanitized, anon-safe view of seed posts only
CREATE OR REPLACE VIEW public.seed_stories_public
WITH (security_invoker = false) AS
SELECT
  id, created_at, content, tags, city, location,
  communication, loyalty, vibe, respect,
  image_url,                       -- keep only if photos are non-PII; otherwise drop (see P0-3)
  subject_name_initial             -- expose an initial/derived field, NOT subject_name/subject_phone
FROM public.stories
WHERE is_seed = true AND status = 'approved';

GRANT SELECT ON public.seed_stories_public TO anon;
```

Then point the unauthenticated seed-feed query (`useStories` / landing seed feed) at `seed_stories_public` instead of `stories`. Authenticated/verified reads can keep using `stories` under the existing authenticated RLS. If you don't have a `subject_name_initial`, add it as a generated column (`left(subject_name,1)`) so the full name never leaves the DB for anon.

---

### P0-3 · Subject photos in a public storage bucket
**File:** `supabase/migrations/…_story-images-bucket.sql` (`public = true`, "Anyone can view story images" policy)
**Problem:** Photos of named, non-consenting subjects are world-readable by URL — no auth.

**Fix:** Make the bucket private and serve via short-lived signed URLs to authorized users.

```sql
UPDATE storage.buckets SET public = false WHERE id = 'story-images';

DROP POLICY IF EXISTS "Anyone can view story images" ON storage.objects;

CREATE POLICY "Verified users can view story images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'story-images'
  AND public.current_user_is_verified()   -- reuse your verification check
);
```

Client change: replace direct `getPublicUrl()` calls for story images with `createSignedUrl(path, 3600)`. If P0-2's view exposes `image_url`, drop that column from the view too so anon never receives image paths.

> **History check:** because the bucket was public, treat already-uploaded photos as already-exposed. Also confirm no service-role key was ever committed (see P2-3).

---

## P1 — High (this week)

### P1-1 · Login rate-limiting is bypassable
**File:** `src/hooks/useAuth.ts` (~line 70) + the `check_rate_limit` SQL function
**Problem:** Identifier is client-built (`login_${email}_${hostname}`) and limits (`p_max_attempts`, `p_block_minutes`) are client-supplied. An attacker calling the RPC directly varies the identifier to reset the counter and passes a huge max.

**Fix:** Derive the identifier and limits **server-side** inside the SQL function (use `auth.uid()` when present, and the request IP via `current_setting('request.headers', true)::json->>'x-forwarded-for'`). Remove `p_max_attempts`/`p_block_minutes` from the client signature and hard-code them in the function. The client should pass only `p_action_type`.

### P1-2 · Dead security utilities (moderation + rate limit not enforced)
**Files:** `SecurityProvider.tsx` (mounted, no consumers), `useSecurityMonitoring.ts` (`moderateContent`), `useEnhancedRateLimit.ts`
**Problem:** `moderateContent` and `checkRateLimit` are never called. Story creation (`useStories.ts:204`) inserts with no moderation. The code advertises protection that does nothing.
**Fix:** Either (a) delete the dead code so it stops implying coverage, or (b) wire it up — and add **server-side** text moderation in the create-story path (an edge function or DB trigger), since client checks are bypassable. The existing admin-approval gate on non-seed posts is your real backstop; keep it.

### P1-3 · Turn on TypeScript strict mode
**Files:** `tsconfig.json`, `tsconfig.app.json`
**Problem:** `strict: false`, `strictNullChecks: false`, `noImplicitAny: false` — the type system is decorative; the clean `tsc` run is meaningless.
**Fix:** Flip incrementally to avoid a wall of errors:
```jsonc
"strict": true,
"strictNullChecks": true,   // turn on FIRST — highest value
"noImplicitAny": true
```
Enable `strictNullChecks` first, fix the fallout (mostly nullable Supabase columns), then the rest. Budget a focused pass; expect a few hundred surfaced issues, most trivial `?.`/guards.

### P1-4 · Stop casting the Supabase client to `any`
**Files:** `useStories.ts` (9×), `useDisputes.ts` (5×), `useInvites.ts` (4×), `useUserStats.ts` (3×)
**Problem:** `(supabase as any)` defeats the generated `types.ts` and hides schema drift. It's ~all of the 115 `no-explicit-any` lint errors.
**Fix:** Remove the casts and use the typed client (`useVerification.ts:30` already does and compiles fine). Where a column genuinely isn't in the generated types, regenerate types (`supabase gen types typescript`) rather than casting. Then add `npm run lint` to the build/CI so this can't regress.

### P1-5 · Fix the failing test / emoji-tag validation
**Files:** `src/lib/security.ts:124` (`validateTag`), `src/lib/__tests__/security.test.ts:166`
**Problem:** Suite is red — `validateTag('❤️ love')` returns invalid; the regex rejects multi-codepoint emoji + variation selectors.
**Fix:** Decide intent. If emoji tags are allowed, broaden the regex to permit emoji ranges + variation selectors (`\u{FE0F}`, ZWJ sequences) with the `u` flag; if not, fix the test. Either way get the suite green and run it in CI.

---

## P2 — Medium (performance & architecture)

### P2-1 · Route-level code splitting
**Files:** `src/App.tsx` (32 routes, zero `lazy`), `vite.config.ts`
**Problem:** Single ~1.2 MB JS bundle; admin/marketing/recharts ship to the landing page.
**Fix:** Convert routes to `React.lazy` + `<Suspense>`:
```tsx
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
// …wrap <Routes> in <Suspense fallback={<Spinner/>}>
```
Lazy-load the admin and SEO/marketing pages first — biggest win for first paint.

### P2-2 · Feed performance (N+1 + no memoization)
**Files:** `src/pages/Home.tsx:141`, `src/components/StoryCard.tsx`
**Problem:** Cards aren't memoized; each mounts ~9 queries (reactions, bookmarks, verification…). Every page append re-renders all cards.
**Fix:** Wrap `StoryCard` in `React.memo`; memoize handlers with `useCallback`. Batch reaction/bookmark counts into the page-level story query (join or RPC) instead of per-card queries.

### P2-3 · `.env` committed to git
**Problem:** `.env` is in `.gitignore` but was committed historically. The key in it is the anon key (public by design), so impact is limited — but it's a leak waiting to happen.
**Fix:** `git rm --cached .env`, then audit history for any **service-role** key: `git log -p -- .env | grep -i service_role`. If one ever appeared, rotate it in the Supabase dashboard.

### P2-4 · Finish the half-done migrations
**Problem:** Two live selfie flows (`RefactoredSelfieCapture` via `Index.tsx` **and** old `SelfieCapture.tsx` via `AuthScreen.tsx`); likely-dead `WelcomeScreen.tsx`; Capacitor v6 push/privacy plugins against v7 core; duplicate unused `@capacitor-community/privacy-screen`.
**Fix:** Pick one selfie flow and delete the other. Remove dead `WelcomeScreen`. Bump `@capacitor/push-notifications` to a v7-compatible release. `npm uninstall @capacitor-community/privacy-screen`.

### P2-5 · Surface errors instead of swallowing them
**Problem:** Many `catch { console.error }` with no user feedback; a few empty catches; debug `console.log`s left in prod.
**Fix:** In mutation/side-effect paths, show a `sonner` toast on failure. Remove debug logs (`useAuth.ts:58`). Keep the `throw` in `useQuery` paths (those are correct).

---

## P3 — Design & accessibility

### P3-1 · Colorblind-inaccessible core interaction (highest design priority)
**File:** `src/components/StoryCard.tsx` (~line 300–325)
**Problem:** Green-flag vs red-flag is distinguished by **color only** (same `Flag` icon, red `#E24B4A` / green `#639922`). ~8% of men can't tell them apart — that's a meaningful slice of an all-male audience.
**Fix:** Add a non-color cue: different icons (e.g. `ThumbsDown`/`Flag` vs `ThumbsUp`/`CheckCircle`), or a visible text label under each ("Red flag" / "Green flag"). Keep the color as reinforcement, not the sole signal.

### P3-2 · Inactive flags fail contrast; touch targets undersized
**File:** `src/components/StoryCard.tsx`
**Problem:** Inactive flags render at `opacity: 0.45` (well below WCAG AA against white). Buttons are ~40px (under the 44px minimum).
**Fix:** Raise inactive opacity to ~0.7+ and verify ≥3:1 for icons. Bump tap targets to ≥44px (`p-2.5` on a 24px icon, or `min-h-11 min-w-11`).

### P3-3 · `juice` button contrast bug
**File:** `src/components/ui/button.tsx:25`
**Problem:** `juice` variant is `text-white` on the amber gradient. White on `#f8b038` fails WCAG AA. The design tokens already say `--primary-foreground` is near-black.
**Fix:** Change `text-white` → `text-primary-foreground` (or `text-black`). One-line fix, applies everywhere the primary CTA renders.

### P3-4 · Collapse the dead token palette
**Files:** `src/index.css`, `tailwind.config.ts`
**Problem:** The IG redesign overrode the old multi-hue palette instead of removing it: `--destructive`, `--juice-pink`, `--accent`, `--ring` all resolve to the same amber as `--primary`. So `destructive` toasts/buttons render amber, not red — semantically wrong for warnings. Meanwhile the flags hardcode hex outside the token system, so they won't theme or adapt to dark mode.
**Fix:** Give `--destructive` a real red again (e.g. the `#E24B4A` you already use for red flags) and route the flag colors through tokens (`hsl(var(--destructive))` / `hsl(var(--success))`) so light/dark and warnings stay consistent. Prune the `juice-pink/purple/blue/lavender` aliases that now just duplicate `--primary`.

### P3-5 · Add Terms of Service + verified social-proof
**Files:** `Landing.tsx` (footer + hardcoded "1,200+ verified men" / "3,400+ stories")
**Problem:** App stores names, phones, and stories about real people with no visible ToS — legal exposure. Stats are hardcoded.
**Fix:** Add a linked ToS/Privacy + the existing dispute mechanism in the footer. Pull the counts from a Supabase aggregate (or a periodically-updated value) so they're honest.

---

## Suggested sequence
1. **Day 1:** P0-1, P0-2, P0-3 (the privacy trio) + verify git history for service-role key (P2-3).
2. **This week:** P1-1, P1-2 (security enforcement), P3-1 + P3-3 (colorblind flags + button contrast — fast, high-impact).
3. **Next:** P1-3/P1-4/P1-5 (type safety + green tests + lint in CI), then P2 perf work.
4. **Polish:** remaining P3 design items.

_The architecture itself is sound — coherent structure, correct admin/RLS model, real test coverage on the security lib. The fixes above are about closing specific gaps, not rebuilding._
