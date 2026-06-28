# Juice — Holistic Roadmap (founder-operator synthesis)

*Integrated across growth, product, engineering, trust & safety, legal, and SEO.*

## The one goal (next 4 weeks)

Stop the first-run bleeding and prove a verified user will **stay and post** — so the funnel
stops leaking at step one. Everything below ladders to that.

## Binding constraint

**Activation + supply, NOT acquisition.** Live data this session: multiple signups deleted
their accounts within 2–7 minutes (jkmccreary twice, woodsy1278). And there are still **0 real
posts** (30 anonymized seeds). More traffic into an app people instantly delete is wasted.
So we fix the first run and get real content **before** any growth push.

## What we are NOT doing right now (the sacrifice)

The viral "tea app for men" channel, prerendering, the dynamic sitemap, P2 design polish,
monetization, and new features. They're real and written down — they wait until the first run
retains and there's true content to see.

---

## P0 — this week (unblock + learn)

- **PUBLISH the backlog.** [you + eng] A large batch of frontend work (teaser feed, unverified
header, Tea-app landing, flag micro-interactions, Explore image fix, delete-reason capture,
verify-nudge UI, all bug-sweep fixes) is committed but **not deployed** — Lovable Publish is
the single gate. Nothing is live until you click it. This is the #1 blocker.
- **Drop in the 5 teaser faces.** [you] Synthetic portraits → `public/lovable-uploads/example-1..5.jpg`
so the unverified teaser looks alive instead of gray.
- **Decide: verified feed = keep seeds (recommended) vs empty.** [you] Don't ship "no stories
yet" into an instant-delete problem; keep the cleaned-up seeds so there's something to read.
- **Watch the new "Why people are leaving" card.** [product] It now captures the reason +
how fast they bounce. Act on the top reason as soon as data appears.
- **Recruit the first 10–20 real posters.** [you, concierge] Your network, by hand. Real
anonymized stories are the supply that makes verifying worth it.
- **Confirm Supabase billing is clear.** [you] Outstanding invoices put the whole DB at risk —
table stakes.

## P1 — next 1–2 weeks (de-risk + convert)

- **Finalize ToS + Privacy Policy with a licensed attorney.** [counsel] Must match what the app
actually does (anonymized content, selfie deletion, takedown flow).
- **Answer the men-only / anti-discrimination question.** [counsel] A verified-men-only model
can raise public-accommodation issues in some US jurisdictions — get a real opinion before scaling.
- **Stand up a moderation + takedown SLA.** [trust & safety] The dispute queue process, response
times, and CSAM/minor-safety screening — before any real traffic.
- **Send the verify-nudge** (test → all) — but only **after** the activation fixes are live, or
it just returns people to the experience they're fleeing. [growth]
- **Fix `robots.txt` sitemap domain** (still points to `thejuice.lovable.app`, not `sipjuice.app`)
and publish the newsjack blog post via /admin/blog. [SEO]
- **Native haptics + Capacitor v6→v7 alignment.** [eng] `@capacitor/haptics` for the iOS flag tap;
keep plugin majors aligned.

## P2 — later (only once retention is proven)

- **Prerendering + dynamic sitemap** — the SEO foundation; pairs with the story-pages-public
decision (currently gated). [SEO + eng]
- **The "tea app for men" viral channel** — one channel (short-form video), the safe-positioning
newsjack. Fire it only when the app retains. [growth]
- **Tech debt:** 103 `as any` casts + regenerate `types.ts`; remove dead `StoryPreview`; add error
states to the admin enrichment queries. [eng]
- **P2 design polish:** emoji/copy cleanup, tap-target audit, `<Helmet>` standardization. [product]
- **Monetization** — not now. [growth]

---

## Open decisions that need YOU

1. Verified feed: keep seeds (recommended) or go empty "be the first."
2. Story pages public vs. gated — SEO upside vs. trust/exposure. (Currently gated.)
3. When to fire the viral "tea for men" push (gated on retention proof).

## Weekly signal (review every Friday)

- Instant-delete rate (deletions within 10 min of signup) trending **down**.
- At least **one real verified user posts unprompted** after the fixes go live.
- If, with a non-empty feed, real users still post zero — that's the most important thing you
could learn, and it changes the whole plan.

## Fatal-risk check (manage every week)

1. **Legal / T&S blowup** — don't drive traffic before ToS + moderation are real; never let the
  company create content about real, identifiable people. This is the moat *and* the landmine.
2. **No distribution** — but that's a *later* risk; today the bucket has no bottom, so retention
  comes first.
3. **The deploy pipeline** — if Publish keeps not happening, none of the above ships. Make it a habit.