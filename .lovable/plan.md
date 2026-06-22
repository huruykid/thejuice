## Goal
Give the landing page hero and bottom CTAs proper vertical breathing room so they read as hero-weight buttons, not toolbar buttons.

## Problem
The hero buttons use `size="lg"` (fixed `h-13` / 52px) but override the text to `text-lg`. Larger text + an icon inside a fixed-height box leaves cramped vertical padding. Industry hero CTAs sit at 56–64px tall.

## Changes (src/pages/Landing.tsx only)

1. **Hero CTAs** (lines ~89–101): swap `size="lg" ... className="text-lg px-8"` to `size="xl"` and drop the `text-lg` override (xl already includes it).
2. **Bottom CTA** (line ~218, "Get Started Now"): same swap to `size="xl"` for consistency.
3. **Header "Get Started"** (line ~69): leave as-is — header buttons should stay compact.

No changes to `button.tsx` — the `xl` size already exists (`h-16 px-12 text-lg`) and was designed for exactly this.

## Out of scope
- Reducing the 3-button hero down to 2 (separate concern from earlier conversation).
- Label consistency across CTAs (separate concern).
- Any mobile-specific changes — `xl` works at both breakpoints.
