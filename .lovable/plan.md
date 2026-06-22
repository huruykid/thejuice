# Auth screen — padding & spacing fix

## What's wrong now

On both mobile (390×844) and desktop (1280+), the logo+title sit pinned near the top while the card floats independently in the middle. The `flex-1` spacer between them creates a large empty void — ~280px on mobile, ~650px on desktop — that makes the page feel broken rather than composed.

Desktop has a second issue: the card is `max-w-md` (~448px) alone in a 1280px viewport with nothing balancing it.

## Plan

Restructure `src/components/AuthScreen.tsx` so the hero (icon + wordmark + tagline) and the card render as **one centered stack** instead of two independently-positioned blocks.

### Layout changes

1. Replace the outer `flex flex-col` + `flex-1 flex items-center justify-center` with a single centered container:
   - Outer: `min-h-screen flex items-center justify-center px-4 py-12`
   - Inner stack: `w-full max-w-md flex flex-col items-center gap-8`
2. Place hero (icon + "The Juice App" + tagline) directly above the card inside that stack. No spacer, no `flex-1`.
3. Keep the "← Back" button as `absolute top-4 left-4` so it stays anchored to the viewport corner on both breakpoints.

### Spacing tokens (responsive)

- Outer page padding: `px-4 py-8 sm:py-12`
- Hero → card gap: `gap-6 sm:gap-8`
- Icon size: `h-14 w-14 sm:h-16 sm:w-16`
- Wordmark: `text-3xl sm:text-4xl`
- Tagline margin: `mt-2`
- Card inner padding: `p-6 sm:p-8` (currently `p-8` is tight on 390px)
- Card → segmented-tabs gap and tabs → heading gap: keep `space-y-6`
- Form field gap: keep `space-y-4`

### Desktop balance

Keep `max-w-md` for the card (auth forms shouldn't stretch wide), but the centered hero+card stack now reads as a single intentional composition rather than two stranded elements.

## Files

- `src/components/AuthScreen.tsx` — only file touched. Pure layout/className changes, no logic changes.

## Out of scope

- Auth flow, tab toggle behavior, copy, colors — all stay as-is.
- Other pages (Home, UnverifiedHome, Landing) — separate spacing pass if needed.
