## Goal

Run a UX copy agent across all 10 marketing pages, audit through a **conversion-first** lens (with virality, readability, SEO as secondary lenses), then ship the recommended copy changes.

## Pages in scope

`Landing`, `HowItWorks`, `Blog`, `BlogPost`, `AnonymousDatingReviews`, `CompetitorAnalysis`, `DatingStoriesForMen`, `MaleDatingCommunity`, `MensDatingAdvice`, `TeaAppComparison`.

## What the agent audits per page

For every page, the agent extracts and rates each copy element:

1. **Hero H1** — clarity of value prop, specificity, hook strength (does it stop the scroll?).
2. **Hero subhead** — does it answer "what + who for + why now" in one line?
3. **Primary CTA label** — action verb, low friction, outcome-oriented (e.g. "Get Started" → "See real stories now").
4. **Secondary CTA** — complementary, not competing.
5. **Section headers** — scannable, benefit-led, not feature-led.
6. **Body paragraphs** — readability (Flesch grade ≤ 8 for marketing), sentence length, jargon.
7. **Social proof / trust copy** — specific numbers vs vague ("thousands of men" → "12,400 verified men").
8. **CTA card at the bottom** — repeats and sharpens the hero promise.
9. **Meta title + description** (SEO secondary lens) — under 60 / 160 chars, keyword aligned with H1.
10. **One viral/shareable line per page** — a pull-quote-worthy sentence that would survive being screenshotted to X / IG.

## Brand voice constraints the agent must hold

- Anonymous, men-only, story-driven. Confidential without being seedy.
- No "guys" / "bro" cringe. No fake urgency ("ACT NOW").
- Don't promise things the product can't deliver (no "find your soulmate").
- Respect existing memory: no invite codes, no location features, no phone-number references.

## Deliverable from the agent

A structured report containing, for each page:

- File:line of each copy block audited.
- Current copy → proposed copy.
- One-line rationale tied to the conversion lens (with virality/readability/SEO callouts where they apply).
- A page-level "biggest win" flag.

Plus a one-paragraph **sitewide voice summary** at the top — the consistent tone the rewrites converge on.

## After the agent returns

I'll review its proposals, then ship the changes in a single batch of file edits — keeping work in JSX text nodes and `<Helmet>` meta tags only. No component restructuring, no business-logic changes.

## Out of scope

- In-app copy (onboarding, empty states inside `/app`) — you opted for marketing pages only.
- Visual/layout changes — copy text only.
- A reusable "copy agent" UI inside the app — this is a one-shot audit, not a feature.
