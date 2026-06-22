# Phase 1 Redesign — "After Hours" (Dark, Disciplined)

Scope is locked to the CEO's Phase 1. Landing, verification flow, and admin polish are explicitly **out of scope** and will be revisited only after the feed has stories and verification conversion is fixed.

## Design Direction

Dark UI, single warm-orange accent, restraint over decoration. Borrows Direction A's discipline (one accent, one type scale, one card radius) inside Direction B's near-black canvas. Private members' club energy — not cheerful SaaS, not gossip tabloid.

## 1. Design Tokens (one pass, lifts every screen)

All tokens go into `src/index.css` as HSL CSS variables and are wired through `tailwind.config.ts`. **No hardcoded color utilities** in components — everything routes through semantic tokens.

**Color (dark, single-accent)**
- `--background` `#0E0E10` · `--surface` `#17171A` · `--surface-elevated` `#1F1F23`
- `--border` `rgba(255,255,255,0.08)`
- `--foreground` `#F5F5F4` · `--muted-foreground` `#A1A1AA` · `--disabled` `#6B6B70`
- `--primary` (Juice Orange) `#FF6B35` · `--primary-pressed` `#E2540E` · `--primary-soft` `rgba(255,107,53,0.12)`
- `--success` `#34D399` · `--warning` `#FBBF24` · `--destructive` `#F87171`
- One reserved gradient/glow token used **only** on the primary CTA. Retired everywhere else.

**Typography**
- Display/logo: **Geist** (via `@fontsource/geist-sans`)
- Body: same family, single stack — no second display face
- Scale: Display 32/700 · H1 24/700 · H2 20/600 · Body 16/400 · Small 14/400 · Caption 12/500
- Line-height 1.3 headings / 1.55 body

**Spacing/Radius/Elevation/Motion**
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 (no arbitrary values)
- Radius: `sm 8` · `md 12` (default card) · `lg 16` · `pill 9999`
- Two shadows only: `--shadow-card` (soft, subtle border + lift) and `--shadow-modal` (stronger)
- Motion: 150ms ease-out for taps, 250ms for sheets/modals. Remove bouncy/float animations.

**Accessibility gate:** WCAG AA contrast verified on `--foreground` / `--muted-foreground` / `--primary` against `--background` and `--surface` before tokens land.

## 2. Component Polish (the 80/20)

**Button** — rewrite `src/components/ui/button.tsx` variants:
- `primary` — solid orange, optional subtle glow, the single hero CTA
- `secondary` — ghost/outline on dark
- `tertiary` — text-only
- Explicit hover / active / disabled / loading states
- Kill every duplicate gradient pill across the app

**Story Card** — the hero component (`StoryCard.tsx`):
- Header row: author handle · location · time
- Rating chips row
- Story body (clamped, expandable)
- Reaction + comment row
- **Trust strip (Phase 1 commitment):** subtle report icon + small "moderated" indicator inline — defamation insurance baked in now
- Padding 16, radius 12, hairline border, one elevation token

**Inputs** — visible labels (no placeholder-only), accent focus ring, on-dark field styling, inline validation.

**Empty states + badges** — consistent treatment for "Founding member" and "Pending review" using the token set; one shared empty-state pattern.

## 3. Brand-Name Consolidation

Sweep the codebase and replace every instance of:
- "Tea App for Men" → removed (or demoted to a single marketing tagline outside the app shell)
- "Join the Brotherhood" → removed
- Canonical name everywhere: **The Juice App** / **sipjuice.app**

Targets include `Landing.tsx`, `EnhancedWelcomeScreen.tsx`, `WelcomeScreen.tsx`, SEO pages, `index.html` meta, and any email templates referenced by edge functions. (Landing visual redesign stays deferred — copy/name only.)

## Explicitly Out of Scope (Phase 2+)

- Landing page redesign
- Verification flow redesign
- Admin queue polish
- Bottom-nav redesign beyond token application
- Any new screens

## Execution Order

1. Install Geist via `@fontsource/geist-sans`, import in `src/main.tsx`, wire `fontFamily` in `tailwind.config.ts`.
2. Rewrite `src/index.css` token block + dark defaults. Update `tailwind.config.ts` to consume them.
3. Update `button.tsx` variants. Sweep app for old gradient pills.
4. Refactor `StoryCard.tsx` to the new spec, including the trust strip.
5. Polish `Input` / `Textarea` for dark.
6. Empty-state + badge pass.
7. Brand-name find/replace sweep.
8. WCAG AA contrast verification (Playwright + screenshot spot-check on the feed, compose, and a card with long content).

## Technical Notes

- Tokens are HSL in CSS vars; Tailwind reads them via `hsl(var(--token))` — required by the project's design-system rule.
- No edits to `index.html` for fonts; `@fontsource` only.
- Story-card trust strip uses `lucide-react` `Flag` icon + `Shield` for the moderation indicator.
- All business logic stays untouched — this is a presentation-layer pass. No changes to `src/lib/`, hooks, or Supabase code.
- No new dependencies beyond `@fontsource/geist-sans`.

## Open Risks

- Dark mode contrast on the orange accent over `--surface-elevated` needs a real check; if it fails AA we shift to `#FF7A47` and re-verify.
- The 129 stuck users and empty feed are **not** solved by this work. Recommend running verification-unblock + story-seeding as a parallel workstream — this redesign should not gate on it, but the polished card will look hollow until there's content to render.
