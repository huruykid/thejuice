# App Review Notes — Juice (paste into App Store Connect → App Review Information)

## Demo account (REQUIRED — fill in before submitting)

Reviewers cannot pass the human selfie-verification gate, so you MUST create a pre-verified account for them:

- Email: `appreview@sipjuice.app` (create it, pre-verify it in the admin panel)
- Password: (set and record here)

Verify the account renders the full app (feed, search, composer) before submitting.

## Suggested review notes text

> Juice is a community where verified adult men (17+) share their own dating experiences. Because every account requires a one-time human-reviewed selfie verification, we've provided a pre-verified demo account above.
>
> Content safety measures:
> • Every member is identity-verified by a human before posting rights are granted — no anonymous public signups.
> • All posts can be reported in-app; a moderation team reviews reports, and repeat offenders are banned.
> • Any person who believes a post about them is inaccurate can request removal WITHOUT an account via our public dispute form: https://sipjuice.app/dispute. Disputed posts are reviewed and removed when appropriate.
> • Users can block other users, and in-app account deletion is available under Privacy Settings.
> • Community guidelines prohibiting harassment, doxxing (no last names, workplaces, addresses, or contact info), and explicit content are enforced at posting time and via moderation.
>
> Camera permission is used only for the one-time verification selfie and for adding a photo to a post. We do not access the photo library.

## Things a reviewer may probe (be ready)

1. **Guideline 1.1/1.2 (objectionable / UGC about real people)** — the highest risk for this app. The notes above front-load the moderation story; the dispute URL being public and functional matters. Test it the week you submit.
2. **Guideline 4.8** — Google sign-in is offered, so **Sign in with Apple must be added before submission** (see readiness report ⛔).
3. **Age rating** — set 17+; the first-run flow already requires 18+ confirmation.
4. **Camera permission string** — must be present in Info.plist or the binary is auto-rejected.
