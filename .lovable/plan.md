## Part 1 — Tighten mobile spacing (How It Works)

Goal: make the Steps section feel compact on mobile (390px). Desktop layout is unchanged.

Edits to `src/pages/HowItWorks.tsx`:

- Hero section: `py-16` → `py-10 md:py-16`, headline `mb-6` → `mb-4`, body `mb-8` → `mb-0`.
- Steps section: `py-16` → `py-8 md:py-16`, vertical rhythm `space-y-16` → `space-y-8 md:space-y-16`, row `gap-12` → `gap-6 lg:gap-12`.
- Step Card header: tighten the icon block on mobile.
  - Number badge `w-12 h-12` → `w-10 h-10 md:w-12 md:h-12`, text `text-lg` → `text-base md:text-lg`.
  - Icon size `h-8 w-8` (Users/Shield/MessageSquare/Eye) → `h-6 w-6 md:h-8 md:w-8`.
  - Header gap `gap-4 mb-4` → `gap-3 mb-2 md:gap-4 md:mb-4`.
  - `CardHeader` default padding is generous; add `className="text-center lg:text-left pb-3 md:pb-6"` and `CardContent` `pt-0 md:pt-6`.
  - Title `text-2xl mb-2` → `text-xl md:text-2xl mb-1 md:mb-2`.
  - Description `text-lg` → `text-base md:text-lg`.
  - Details list `space-y-3` → `space-y-2 md:space-y-3`; checkmark `h-5 w-5` → `h-4 w-4 md:h-5 md:w-5`.
- Features + FAQ + CTA sections: reduce mobile vertical padding `py-16` → `py-10 md:py-16` and `mb-12` → `mb-8 md:mb-12` for consistency with the tightened steps.

No copy changes, no desktop changes, no logic changes.

## Part 2 — What would Instagram / Meta do to this page?

Meta's product design playbook for a marketing/explainer page like this:

1. Kill the card-on-card "soft" look. Meta marketing pages (about.meta.com, ai.meta.com, Instagram's /features) use full-bleed sections with a flat background, big type, and no nested shadowed cards. The current `bg-white/80 backdrop-blur` cards on a `bg-gradient-soft` background reads as 2018 SaaS — they'd remove the card chrome entirely on each step.
2. Editorial typography hierarchy. Display-size headlines (text-6xl / 7xl on desktop), much tighter line-height, and a confident sans (Instagram Sans / Meta Sans equivalent — e.g. a geometric sans like Söhne, Inter Display, or Sharp Grotesk). Body copy gets shorter and larger; one sentence per step, not a 4-bullet checklist.
3. Step layout becomes a horizontal numbered scroller on mobile (snap carousel) and a 4-up grid on desktop, instead of the current alternating row. This is how IG presents "How it works" for Reels/Threads.
4. Replace the emoji-in-gradient-square illustration with a real product screenshot in a phone frame, or an autoplaying 6-second muted MP4 per step. Meta never ships emoji as the visual anchor.
5. Anchor the page on social proof and outcomes, not features. Top of page: a single big stat ("50,000+ verified men"). Each step ends with an outcome line, not a bullet list.
6. Sticky bottom CTA bar on mobile ("Get the app") that follows scroll — Meta uses this on every IG/Threads/WhatsApp marketing page on mobile.
7. Compress the FAQ into a single `<details>` accordion instead of 4 stacked cards, and move it below the CTA. Meta treats FAQ as reference, not as a primary scroll section.
8. Trim copy 40–60%. Meta marketing pages rarely exceed ~30 words per section; the current page is ~3x that.

If you want, I can scope Part 2 into a follow-up plan (1–2 of the items at a time — e.g. start with #1 + #4 + #6, which give the biggest visual lift).

## Out of scope
- Refactoring `HowItWorks.tsx` into smaller components.
- Touching the desktop alternating-row layout.
- Any non-mobile spacing other than the small `md:` parity tweaks listed above.
