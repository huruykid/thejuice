# Repo Sanity Check Plan

Run a non-destructive health check on the project to confirm it installs, typechecks, builds, and boots without runtime errors.

## Steps

1. **Install dependencies**
   - `bun install` at the project root.
   - Report any peer-dep warnings or install failures.

2. **TypeScript check**
   - Run `tsgo` against `tsconfig.app.json` (and `tsconfig.node.json` for Vite config).
   - Capture and summarize any type errors by file.

3. **Lint (quick pass)**
   - `bunx eslint .` using the existing `eslint.config.js`.
   - Only report errors, not style warnings.

4. **Unit tests**
   - `bunx vitest run` to execute the existing Vitest suites under `src/lib/__tests__/`.
   - Report pass/fail counts and any failing test names.

5. **Production build**
   - `bunx vite build`.
   - Confirm it completes and note bundle size warnings.

6. **Runtime smoke test**
   - The Vite dev server is already running on localhost (typically :8080).
   - Drive Playwright headless to load `/` and `/app`, capture screenshots, and dump console errors + failed network requests.
   - Report any runtime errors surfaced in the browser console.

## Deliverable

A single summary listing, for each step: status (pass / warn / fail), counts, and the first few error lines if anything fails. No code changes will be made — if issues are found, I'll list them and wait for you to decide what to fix.
