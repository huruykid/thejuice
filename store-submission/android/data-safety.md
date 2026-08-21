# Google Play Data Safety Form — Answers (Juice)

Same audit basis as iOS privacy labels: Supabase auth, camera selfie verification, story photos, city geolocation, push notifications, GA4/GTM. No ads, no payments, no crash SDK.

## Overview questions
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes** (HTTPS/TLS everywhere)
- Do you provide a way for users to request that their data is deleted? **Yes** — in-app (Privacy Settings → Delete account) **and** web: https://sipjuice.app/support (deletion instructions; Play requires this URL in the form)

## Data types

| Data type | Collected | Shared | Ephemeral | Required | Purposes |
|---|---|---|---|---|---|
| Personal info → Email address | Yes | No | No | Required | App functionality, account management |
| Personal info → User IDs | Yes | No | No | Required | App functionality, account management |
| Photos & videos → Photos | Yes | No | No | Required (verification) / Optional (posts) | App functionality |
| Location → Approximate location | Yes | No | No | Optional | App functionality |
| Messages / Other UGC → Posts | Yes | No | No | Optional | App functionality |
| App activity → App interactions | Yes | No | No | Optional | Analytics |
| Device or other IDs | Yes | No | No | Optional | Analytics |

"Shared" = No throughout: GA4 is a service provider processing on your behalf (not sale/sharing for advertising). Keep GA ads features off or this answer changes.

## Additional declarations
- Ads: **No ads**
- Target audience: 18+ only (do not select any child age bands)
- News app: No · COVID app: No · Government app: No
- UGC: app contains user-generated content → complete the UGC policy declaration: in-app reporting ✅, blocking ✅, human moderation ✅, public dispute/removal channel ✅ (https://sipjuice.app/dispute)
