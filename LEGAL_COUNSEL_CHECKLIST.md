# Juice (sipjuice.app) — Counsel Engagement Brief

_One-page brief to hand a startup / media-and-internet attorney. Prepared 2026-06-25. This is an internal risk summary, not legal advice._

## What it is
Mobile-first web app: **verified men (18+) anonymously post dating "reviews" about real people** (typically women), under codenames. UGC platform whose core content is claims about real, often-named individuals. Built on React + Supabase. Live, pre-traction (~200 verified users).

## Risk profile (why we're engaging you)
Defamation, privacy / right-of-publicity, Section 230 reliance, minor-safety, and app-store content rules are the core exposures. We want the platform to be the *responsible* operator in a category where competitors (Tea, TeaOnHer) have faced breaches, app-store removals, and "doxxing tool" criticism.

## What we've ALREADY done (so you can focus your time)
- **No company-created content about real people.** We removed all seeded/fabricated posts about real individuals; only genuine user posts (or clearly fictional sample personas) remain. We understand first-party content is outside §230.
- **Data minimization:** verification selfies are deleted on approval (+ daily sweep); subject photos moved to private storage (signed URLs, verified members only); subject phone numbers stored only as a one-way hash, never displayed or returned.
- **Notice-and-takedown:** public `/dispute` removal flow (no account needed), admin review queues.
- **Age:** 18+ enforced via DB constraint + signup date gate + a required **clickwrap** ("I'm 18+ and agree to Terms & Community Guidelines").
- **Drafted (plain-English, needs your review):** Terms of Use, Community Guidelines / Acceptable Use Policy, and an updated Privacy Policy reflecting the above.

## What we need from you (priority order)
1. **Terms of Service — finalize binding clauses:** arbitration + class-action waiver, limitation of liability, indemnification (user indemnifies platform for their posts), IP license, termination, governing law/venue. Confirm our **clickwrap** capture is enforceable as implemented.
2. **§230 posture & content liability:** confirm our reliance is sound given we host (not author) content; review our "post only your own first-hand experience" rule and the no-first-party-content position.
3. **Defamation / right-of-publicity:** review the model and our guardrails; advise on the highest-risk content patterns and the takedown SLA needed.
4. **Privacy Policy & data law:** review for CCPA/CPRA, GDPR (if EU traffic), **biometric/selfie law (e.g., BIPA)** given verification selfies, breach-notification duties, and the **reverse phone-number search** feature (data-broker / state AG exposure — advise whether to keep it).
5. **Minor safety:** confirm our 18+ assurance is adequate; establish the **minors-prohibited-as-subjects** policy and **NCMEC reporting** path for any CSAM.
6. **App-store UGC compliance** (Apple Guideline 1.2 / Google): we need content filtering, in-app reporting with **action within 24h**, user blocking, and published contact before the iOS/Android apps ship.
7. **DMCA agent registration** + counter-notice process.
8. **Corporate/insurance:** confirm the operating entity shields the founder, and advise on **media / cyber liability insurance**.

## Key questions
- Given the category, what's our realistic litigation exposure, and what single change most reduces it?
- Is the reverse phone-search feature worth the privacy/regulatory risk, or should it go?
- What's the minimum viable moderation SLA and transparency posture you'd want us to commit to publicly?

## Pointers
Terms/Guidelines: `/terms` · Privacy: `/privacy-policy` · Removal flow: `/dispute` · Contact: support@sipjuice.app
