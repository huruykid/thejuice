# Compliance Checklist — Juice (app.sipjuice v1.0.0)

## Both stores
- [✅] Privacy policy URL live and accurate — https://sipjuice.app/privacy-policy (route + static fallback exist)
- [✅] Account deletion in-app — `delete-account` edge function via Privacy Settings
- [✅] No external payment for digital goods — app is free, no payments found in codebase
- [✅] All third-party SDK data collection declared — GA4/GTM covered in both privacy docs
- [⚠️] Metadata claims match actual features — copy drafted from the real product; re-read after any feature change
- [⚠️] No placeholder/broken content — dist build renders; do a full click-through on device before archiving

## App Store
- [✅] Privacy nutrition labels drafted — `ios/privacy-labels.md`
- [⛔] Demo account prepared — reviewers can't pass selfie verification; create + pre-verify one (`ios/review-notes.md`)
- [⚠️] NSUsageDescription strings — camera string written (APP_STORE_SUBMISSION.md §2) but Info.plist doesn't exist yet (no ios/ project)
- [⛔] Sign in with Apple — app offers Google sign-in but NO Apple option → Guideline 4.8 auto-rejection. Must add before submitting
- [⚠️] 4.2 hardening — splash/status bar/push configured in capacitor.config.ts; verify offline state + safe areas on device
- [✅] Export compliance answer prepared — HTTPS only, exempt (`ITSAppUsesNonExemptEncryption=false`)
- [✅] Age rating answers drafted — 17+ (`ios/metadata.md`)
- [⚠️] Screenshots — exact 1320×2868, ≤10 ✅, but current set shows web/marketing pages, not the logged-in app (Guideline 2.3 risk). Recapture from a verified session before submitting

## Google Play
- [✅] Data Safety form drafted — `android/data-safety.md`
- [✅] Web link for account deletion — https://sipjuice.app/support documents deletion
- [⚠️] Target SDK current, AAB output — set in android/ project once generated (doesn't exist yet)
- [✅] Content rating (IARC) answers drafted — Mature 17+, UGC declared
- [⚠️] Feature graphic 1024×500 — generated, but it's a template; replace with designed art
- [✅] Screenshots ≥2, within 320–3840px — 5 × 1080×1920
- [⚠️] Closed testing plan — if the Play account is a new personal account, 12+ testers for 14 days is required before production access (verify current terms)

## Juice-specific (beyond the standard checklist)
- [⛔] Apple 1.1/1.2 exposure — reviews of real, named, non-consenting people is the single biggest approval risk; the dispute flow, moderation story, and review notes are the mitigation. Counsel review before first submission strongly advised
- [✅] Public dispute/removal path — /dispute works without an account
- [✅] Report + block flows in-app
