# Apple App Privacy — Nutrition Label Answers (Juice)

Audited against the codebase: Supabase auth (email + Google OAuth), camera selfie verification, story photos, city geolocation (`useGeolocation`), push notifications, Google Analytics 4 + GTM (ships in `index.html`, so it runs inside the wrapped app). No ads SDK, no crash-reporting SDK, no payments, no data brokers.

Answer "Yes, we collect data from this app," then declare:

| Data type | Collected | Linked to identity | Tracking | Source |
|---|---|---|---|---|
| Contact Info → Email Address | Yes | Yes | No | Supabase auth (email + Google sign-in) |
| User Content → Photos or Videos | Yes | Yes | No | Verification selfie (camera) + story photos |
| User Content → Other User Content | Yes | Yes | No | Reviews/stories, names + cities of people reviewed |
| Identifiers → User ID | Yes | Yes | No | Supabase user UUID |
| Identifiers → Device ID | Yes | No | No | GA4 client/device identifiers |
| Location → Coarse Location | Yes | Yes | No | City-level location for stories/search |
| Usage Data → Product Interaction | Yes | No | No | GA4 / Google Tag Manager events |

Everything else (Health, Financial, Contacts, Browsing History, Search History, Sensitive Info, Diagnostics, Purchases): **Not collected**.

Notes
- **Tracking = No everywhere** → no ATT prompt needed. This holds only if GA4 stays in "no ads features" mode — do not enable Google Signals / ads personalization in GA, or these answers become false.
- Search queries aren't persisted server-side (no search-log table found), so Search History = not collected. Re-check if you ever add search logging.
- These answers must match `PrivacyInfo.xcprivacy` (see APP_STORE_SUBMISSION.md §3) — currently consistent, except the manifest should also gain a Coarse Location entry if you keep city collection. Add:
  `NSPrivacyCollectedDataTypeCoarseLocation`, linked=true, tracking=false, purpose=AppFunctionality.
