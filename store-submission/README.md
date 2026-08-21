# Juice — Store Submission Readiness

App: **Juice** · Bundle ID: `app.sipjuice` · Version: 1.0.0
Kit generated: 2026-07-02 · Companion doc: `../APP_STORE_SUBMISSION.md` (native-project steps)

## Status: 14 of 21 items ready — 3 blocking

## ✅ Ready

- **Icons & splash** — `assets/icons/` (iOS 1024 no-alpha, Play 512, adaptive layers, all launcher sizes), `assets/splash/` (2732² iOS, 1080×1920 Android). All pass spec validation.
- **iOS metadata** — `ios/metadata.md`: name 30/30, subtitle 27/30, keywords 91/100, promo 159/170, description, URLs, category, 17+ rating, export compliance.
- **Android metadata** — `android/metadata.md`: title 30/30, short description 79/80, full description, IARC guidance.
- **Privacy labels** — `ios/privacy-labels.md`, audited against the actual stack (Supabase, GA4/GTM, camera, city location). No tracking → no ATT prompt.
- **Data Safety form** — `android/data-safety.md`, incl. UGC declarations and the required web deletion link (support page).
- **Review notes draft** — `ios/review-notes.md` with the moderation/dispute story App Review will ask about.
- **Compliance checklist** — `compliance-checklist.md` with per-item pass/fail.
- Web-side requirements already in the product: in-app account deletion, privacy policy, terms, support page, report/block/moderation, public dispute form.

## ⛔ Blocking — must fix before submission

1. **Sign in with Apple is missing (Guideline 4.8).** The app offers Google sign-in; Apple auto-rejects third-party login without an Apple option. Add `apple` as a Supabase OAuth provider + a "Continue with Apple" button in `AuthScreen.tsx`. This is the one code change required.
2. **No native iOS/Android projects exist.** Nothing can be archived or uploaded until you run, on your Mac:
   `npm install && npm run build && npx cap add ios && npx cap add android && npm run assets:generate && npx cap sync`
   Then apply Info.plist camera string, PrivacyInfo.xcprivacy, and push entitlement per `APP_STORE_SUBMISSION.md` §2–5.
3. **Pre-verified demo account for App Review.** Reviewers cannot pass selfie verification. Create `appreview@sipjuice.app`, verify it via the admin panel, record credentials in `ios/review-notes.md`.

## ⚠️ Needs your input

- **Screenshots show the website, not the logged-in app.** Current captures (landing, how-it-works, auth, comparison, support) are real and correctly sized (1320×2868 / 1080×1920) but Apple's Guideline 2.3 expects the actual app UI. Once you have a verified session, recapture the feed, search, and composer — same dimensions. I can do this with a test login.
- **Feature graphic** (`assets/feature-graphic-1024x500.png`) is a generated template — replace with designed art.
- **Apple Developer Program** ($99/yr) + signing certificates — Xcode handles signing once enrolled.
- **Play Console** account verification; new personal accounts need a closed test (12 testers / 14 days) before production.
- **Support email** for the Play listing (`android/metadata.md`).
- **Counsel check** — Apple 1.1/1.2 is the real approval risk for an app hosting reviews of real, named, non-consenting people. Build can be perfect and still be rejected on policy; the review-notes moderation story is the best mitigation we control.

## Submission steps

### iOS
1. Fix blocking items 1–3 above.
2. On the Mac: `npm run build && npx cap sync && npx cap open ios`.
3. Xcode: set team/signing, add Push capability, confirm Info.plist + PrivacyInfo.xcprivacy, bump build number.
4. Product → Archive → Distribute → App Store Connect.
5. In App Store Connect: create the app (bundle `app.sipjuice`), paste everything from `ios/metadata.md`, upload `ios/screenshots/`, answer privacy per `ios/privacy-labels.md`, set 17+, paste `ios/review-notes.md` + demo credentials, submit.

### Android
1. `npx cap open android` → Build → Generate Signed Bundle (.aab) with an upload key (keep the keystore safe — losing it is unrecoverable).
2. Play Console: create app, complete Data Safety per `android/data-safety.md`, IARC questionnaire, paste `android/metadata.md`, upload screenshots + feature graphic + 512 icon.
3. Run the closed test if required, then promote to production.
