## Goal

Right now `/blog`, `/`, `/how-it-works`, and the SEO landing pages each have their own ad-hoc header (or none at all). A visitor landing on `/blog` from Google has no way to reach the rest of the site. Add a single reusable public header + footer used across every public/marketing page.

## What this adds

**`PublicHeader`** — sticky top bar, mobile-first

```text
[ Juice logo ]                          [ ☰ menu ]
```

- Logo on the left → links to `/`
- Hamburger drawer on mobile, inline links on desktop (≥768px)
- Links: **Home · Blog · How It Works · Sign In**
- "Sign In" is a filled CTA button (uses existing primary token)
- Active route gets an underline / accent color
- Solid background with subtle bottom border; sticky so it follows scroll

**`PublicFooter`** — at the bottom of every public page

- Small brand mark + tagline
- Same nav links (Home, Blog, How It Works, Sign In)
- Legal: Privacy Policy, Support
- Copyright line

**Breadcrumb on blog pages**
- `/blog` shows `Home › Blog`
- `/blog/:slug` shows `Home › Blog › {post title}`
- Placed directly under the header, above the page title
- Marked up with `BreadcrumbList` JSON-LD for SEO

## Pages that get the new chrome

Wrap each of these in a new `<PublicLayout>` (header + `<main>` + footer):

- `src/pages/Landing.tsx`
- `src/pages/Blog.tsx`
- `src/pages/BlogPost.tsx`
- `src/pages/HowItWorks.tsx`
- `src/pages/AnonymousDatingReviews.tsx`
- `src/pages/DatingStoriesForMen.tsx`
- `src/pages/MaleDatingCommunity.tsx`
- `src/pages/MensDatingAdvice.tsx`
- `src/pages/CompetitorAnalysis.tsx`
- `src/pages/TeaAppComparison.tsx`
- `src/pages/PrivacyPolicy.tsx`
- `src/pages/Support.tsx`

Existing per-page back buttons and one-off brand headers are removed in favor of the shared header. The authenticated app shell (`AppShell`, `Home`, `Explore`, etc.) is **not** touched.

## Technical notes

- New files:
  - `src/components/layout/PublicHeader.tsx`
  - `src/components/layout/PublicFooter.tsx`
  - `src/components/layout/PublicLayout.tsx` (wraps children with header + `<main>` + footer)
  - `src/components/layout/Breadcrumbs.tsx` (renders visible trail + JSON-LD)
- Uses existing shadcn `Sheet` for the mobile drawer and `Button` for the CTA
- "Sign In" links to `/` (the existing auth entry) — same destination the current Landing CTA uses
- All colors use semantic tokens from `index.css` (no hardcoded hex), so the header inherits theme
- No backend/database changes
- No new dependencies
