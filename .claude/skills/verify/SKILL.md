---
name: verify
description: Build, launch, and drive this app headlessly to verify changes at the real UI — including auth-gated flows, with network-mock recipes for Supabase and external APIs.
---

# Verifying Juice changes at the running app

## Build + serve

```bash
npm install            # .npmrc already sets legacy-peer-deps
npm run build
npx vite preview --host 127.0.0.1 --port 4173   # plain `preview` fails on IPv6
```

## Drive with Playwright

Project has no Playwright dep; install it in a scratch dir and launch the
pre-provisioned browser:

```js
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

Screenshot public pages directly. Sandboxes usually block supabase.co and
other external hosts — intercept at the network layer with `page.route`,
which doubles as proof of what the browser sends.

## Reaching auth-gated states without a real login

The Supabase client uses the implicit flow with `detectSessionInUrl`, so a
hash token puts the app in a logged-in state with **no real credentials**:

```js
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const FAKE_JWT = `${b64({alg:'HS256',typ:'JWT'})}.${b64({
  sub: '<uuid>', aud: 'authenticated', role: 'authenticated',
  email: 'x@y.z', exp: Math.floor(Date.now()/1000)+3600 })}.sig`;
// /reset-password: append  #access_token=<JWT>&refresh_token=f&expires_in=3600&token_type=bearer&type=recovery
// generic login state: same hash without  type=recovery
```

Then mock the endpoints gotrue and the app hit:

- `GET  {SB}/auth/v1/user` → 200 with a user object (`id` matching the JWT `sub`)
- `PUT  {SB}/auth/v1/user` → 200 (password update); **count these calls** to
  assert a gate blocked or allowed the update
- any other `{SB}/rest/v1/*` → `[]` (NOT `{}` — an object makes list-shaped
  hooks like `useRealIsAdmin` misread and the ViewAs admin bar appears)
- other `{SB}/*` → `{}`

## HIBP leaked-password gate (src/lib/passwordCheck.ts)

Mock `https://api.pwnedpasswords.com/range/*` with `SUFFIX:COUNT` lines
(uppercase SHA-1). Compute the suffix for a chosen password with node
`crypto`. Cases worth driving: match (count>0) must block with a toast and
zero PUTs; no match proceeds; `SUFFIX:0` (padding) is NOT a match; aborted
or hanging responses must fail open (4s timeout) and proceed.

## Gotchas

- AuthScreen has BOTH a "Create account" tab and a "Create Account" submit
  button — `button:has-text("Create Account")` matches the tab first, and
  clicking it re-mounts the form and silently wipes the password field. Use
  `button[type="submit"]` for the submit. Signup blocked-by-gate evidence:
  count `POST {SB}/auth/v1/signup` (0 = blocked); breach errors surface as a
  "Sign up failed" toast with the gate's message.

- Wait for the form with `waitForSelector('input', {timeout: 15000})`, not a
  fixed sleep — the recovery event lands at variable times.
- Toasts persist several seconds; a second submit's toast may read as the
  previous one. Query toasts per-step on fresh pages when the text matters.
- The reset success screen auto-redirects to /app after ~2.5s — screenshot
  before the redirect or expect UnverifiedHome text in captures.
- Kill the preview server in its own Bash call (`pkill -f "vite preview"`
  aborts a compound command chain with exit 144).
