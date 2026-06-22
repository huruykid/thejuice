## Part A — Button spacing fixes (recommend shipping all)

1. **`src/components/ui/button.tsx:40`** — change `lg: "h-13 px-8 text-base"` → `lg: "h-14 px-8 text-base"`. This single edit restores 17 cramped hero/CTA buttons across HowItWorks, BlogPost, AnonymousDatingReviews, CompetitorAnalysis, DatingStoriesForMen, MaleDatingCommunity, MensDatingAdvice, TeaAppComparison.
2. **`src/pages/Landing.tsx:208`** — promote the "Get Started Now" CTA from `size="default"` → `size="xl"` so it matches the hero.
3. **`src/pages/BlogPost.tsx`** — standardize both Share buttons to `size="sm"` (header at line 97 already is; bump footer line 215 down from default).

Out of scope for this pass:
- Adding a missing hero CTA on `TeaAppComparison.tsx` — that's a content decision, not a spacing fix. Flagging only.

## Part B — Font direction

Pick ONE pairing to apply. I'll then:
1. Add the Google Fonts `<link>` to `index.html`.
2. Update `tailwind.config.ts` `fontFamily.sans` / `fontFamily.display` to the new families.
3. Apply `font-display` to `h1`/`h2` in `src/index.css` so the display font actually renders (it currently doesn't).
4. Tune `leading-tight` / `leading-none` on hero headlines if Barlow Condensed is chosen.

The three options:
- **DM Serif Display + DM Sans** — credible, broadsheet, review-platform trust.
- **Barlow Condensed 800 + Barlow** — punchy, sports-mag, community-movement energy.
- **Playfair Display SC + Source Sans 3** — secret-society small-caps, anonymity vibe.

I'll ask you to pick the pairing once this plan is approved.
