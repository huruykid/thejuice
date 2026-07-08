# Juice (sipjuice.app)

Anonymous dating-review PWA for verified men. Vite + React 18 + TypeScript + Tailwind +
shadcn/ui, Supabase backend (Postgres + RLS + 21 edge functions), built/deployed via Lovable.
Canonical host is `sipjuice.app` — `teaappformen.com` is a JS-redirect alias, `thejuice.lovable.app`
is staging (both self-noindex via the head script in `index.html`).

## Commands

```bash
npm install          # .npmrc sets legacy-peer-deps (react-day-picker@8 vs date-fns@4)
npm run typecheck    # tsc, must stay clean
npx vitest run       # unit tests, must stay green
npm run design:check # design-token guardrail, must stay clean
npm run build        # production build
npm run lint         # carries ~125 pre-existing no-explicit-any errors; don't add new ones
```

Before pushing: typecheck + tests + design:check + build, and screenshot any UI change
(headless Chromium; in sandboxed environments use `executablePath: '/opt/pw-browsers/chromium'`
and `vite preview --host 127.0.0.1` — plain `preview` fails on IPv6).

## Architecture

- `src/App.tsx` — all routes. Guards: `ProtectedRoute` (login), `VerifiedRoute` (approved
  verification), `AdminRoute`. Logged-out hits on gated routes go through `LoginRedirect`,
  which carries `?returnTo=<path>`; `Index.tsx` honors it post-verification (same-origin only).
- `src/pages/Index.tsx` — the `/app` state machine: AuthScreen → UnverifiedHome (soft gate:
  can post, can't read) → verification flow (profile → selfie → pending/rejected) → Home.
  Unverified users are never force-marched; they opt in via `verifyMode`.
- `supabase/migrations/` — schema history. Apply to prod via Supabase MCP `apply_migration`
  AND commit the identical SQL as a timestamped file here. Dry-run first inside
  `begin; ... rollback;` via `execute_sql`.
- Security model is RLS-first: `is_user_verified()` gates content reads; `has_role()` gates
  admin. SECURITY DEFINER helpers referenced in RLS policies MUST stay executable by the
  querying roles (anon/authenticated) — policy expressions run as the caller.

## Hard-won gotchas

- **Postgres grants:** functions default to EXECUTE for PUBLIC. `revoke ... from anon` alone
  is a no-op — revoke from PUBLIC and re-grant the roles that need it (incl. service_role for
  edge-function callees). Verify with `has_function_privilege()` after applying.
- **pg_net in public schema:** accepted permanent exception (cannot be relocated; documented
  by `is_pg_net_exception_acceptable()` in the DB). Don't try to move it.
- `anon` has no table-level SELECT on `stories` — logged-out visitors read nothing directly;
  teaser/search go through `search_subject_preview` (authenticated) and synthetic cards.

## Conventions

- **Design tokens only** — semantic classes (`bg-background`, `text-muted-foreground`,
  `text-success`/`text-destructive`); never raw Tailwind colors, `bg-white/*`, or `text-white`
  on amber. `npm run design:check` enforces part of this.
- **Editorial design language** (marketing pages): condensed display type (`font-display`,
  uppercase, tight leading), hairline rules (`border-t-2 border-foreground` section headers),
  left-aligned layouts, flat ink CTA bands. No glassmorphism, no gradient cards, no icon-in-
  rounded-box grids, no centered pill badges.
- **Brand vocabulary:** Juice = green flag, Milk = red flag — always pair the slang with the
  flag name in UI labels. Members are anonymous: codenames (`@quietly_done`), never real names.
- **No fabricated numbers or testimonials.** Trust copy must be honest and non-numeric until
  real volume exists.
- **SEO:** every public page sets Helmet title/description/canonical; FAQ content mirrors
  actual searcher phrasing ("tea app for men" family) with FAQPage JSON-LD; CTAs are crawlable
  `<Link>`s, not onClick buttons; gated routes stay out of `public/sitemap.xml` and are
  disallowed in `public/robots.txt`.
- Commit messages explain the why; audits live in repo docs (`SECURITY_AUDIT_*.md`,
  `UX_AUDIT.md`, `DESIGN_AUDIT.md`) with STATUS notes when items are applied.
