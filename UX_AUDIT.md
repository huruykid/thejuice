# UX Audit — Juice (journey-focused)

> **STATUS 2026-07-06:** all items below were implemented the same day (verdict vocabulary
> pairing, returnTo deep links, publish-button guidance, CTA copy, per-file photo validation,
> orientation banner, branded 404, ipapi.co removal, tap targets, pending-overdue support link,
> landing hero search). Kept for the record of rationale.

**Date:** 2026-07-06 · **Method:** drove the built app in headless Chromium (public journey,
mobile + desktop viewports) and traced the auth-gated flows in code (`Index.tsx` gate,
onboarding components, composer, search, feed). Complements `DESIGN_AUDIT.md`, which covers
visual consistency; this audit covers **comprehension, friction, and journey continuity**.

## What's genuinely strong (keep)

- **Search-first "magic moment"** on every tier of the funnel (UnverifiedHome, VerificationPending,
  verified Home) — the core value prop is one input away at all times.
- **Soft verification gate** — unverified users can post immediately and read teasers; nobody is
  force-marched through onboarding. The stall-recovery "one step from verified" resume card is
  excellent retention design.
- **Honest gating** — the teaser feed uses synthetic cards instead of blurring real content
  (no PII leak via devtools), and the pending state says "we'll come to you" instead of
  encouraging refresh-anxiety.
- **Feed fundamentals** — skeletons, error + retry, empty states with next actions, pull-to-refresh,
  infinite scroll with "you're all caught up".
- **Auth screen trust posture** — "identity-checked by a real person", Google-scope disclosure,
  age gate at signup.

---

## P0 — comprehension

**1. The vote vocabulary fractures exactly at the moment of first contribution.**
The funnel teaches three different languages for the same primitive:

| Surface | Vocabulary |
|---|---|
| Landing / SEO pages | green flag / red flag |
| Subject search results | "mostly green flags" / "mostly red flags" |
| **Composer verdict buttons** | **"Juice" / "Milk"** — no explanation |
| StoryCard reactions | Juice / Milk icons (aria-labels do map them to flags) |

A first-time poster must *guess* that Milk = red flag ("milk" reads as neutral or even
wholesome; nothing on screen says it's negative). The composer is the single most important
form in the product and its required verdict field is unlabeled slang.
**Fix:** keep the brand names, add the mapping inline — `Juice · green flag` / `Milk · red flag`
(or a one-line caption under the buttons). Use the same paired label on StoryCard buttons so
the vocabulary is taught by the feed before the composer needs it.

## P1 — friction & continuity

**2. Deep links lose intent for logged-out members.** `VerifiedRoute` redirects to `/`
(marketing page) with no `returnTo`. A verified member opening a shared `/story/:id` or
`/explore` link on a new device lands on the landing page, has to locate "Log in", and after
signing in is dropped at `/app` — the original destination is gone. Same for `/admin/*`.
**Fix:** redirect to `/app?mode=login&returnTo=<path>` and navigate to `returnTo` after auth.

**3. The publish button goes dead with no explanation.** `canPublish` requires five things
(name, verdict, story, ≥1 photo, honesty ack). Until all five are set the primary button is
just disabled — nothing tells the user what's missing (the photo requirement is the usual
surprise). **Fix:** under the disabled button, one muted line naming the first missing item
("Add at least one photo to publish"), or validate-on-tap with focus moved to the gap.

**4. "Pass on the Juice" is ambiguous English.** "Pass on X" means *decline X* as readily as
*pass X along* — a primary CTA that can be read as "skip" is a real hesitation point, and the
same phrase seeds the empty feed state. **Fix:** "Post it" / "Share the Juice" (already used
elsewhere) for the button.

**5. Composer photo selection aborts wholesale on one bad file.** Pick 4 valid photos + 1
oversized and the handler rejects the entire selection (early `return` in the validation
loop). **Fix:** keep valid files, toast only the rejected ones.

**6. Post-signup orientation relies on one paragraph.** UnverifiedHome is strong, but the
"you're signed up / verify to read / post now" model lives in a single muted-text sentence.
Consider a dismissible first-visit banner that names the two paths explicitly. (Minor; the
resume card already handles the biggest dropout.)

## P2 — polish & posture

**7. 404 page is a dead end off the design system.** Default blue underlined link, no brand
lockup, no nav, "Oops!" copy. For an SEO-driven site this page will be hit. **Fix:** brand it,
offer Home + Search + How-it-works, keep it on tokens.

**8. Composer calls `ipapi.co` (third-party IP geolocation) on every open** just to preset the
phone country code. For a product whose whole pitch is privacy, shipping users' IPs to a
third party silently is off-posture (and it's a render-blocking-ish fetch that fails silently).
**Fix:** default from `navigator.language` region or the user's saved profile city; drop the
external call.

**9. Small tap targets in the sticky headers.** The "Verify" text button (UnverifiedHome
header) is `text-xs` with no padding — well under 44px. Same class of issue flagged in
DESIGN_AUDIT for bottom nav. **Fix:** `min-h-11 px-3` on header actions.

**10. Pending state has no expectation drift handling.** "24–48 hours" is stated, but if review
takes longer there's no in-app path (no "it's been 3 days" support link). **Fix:** show a
support link when `submitted_at` is older than 48h.

**11. Landing → app vocabulary handoff.** The landing page (correctly) sells "look her up
before the date", and `/app?q=<name>` deep links exist for email nudges — but the landing
search moment isn't interactive; the hero CTA goes to generic signup. Consider a real search
input in the landing hero that deep-links to `/app?q=<name>` (signup with intent attached is
the strongest activation path this product has, per the search_miss nudge loop).

---

## Suggested order

1. P0-1 verdict vocabulary (one-file fix, biggest comprehension win)
2. P1-2 returnTo on gated routes + P1-3 disabled-button reason + P1-4 CTA copy
3. P1-5 file validation, P2-7 404 page, P2-9 tap targets (mechanical)
4. P2-8 ipapi removal (privacy posture)
5. P2-10 / P2-11 when touching those surfaces next
