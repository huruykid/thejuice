# Workflow Gaps — PM Tracker

Source of truth for fixing the gaps surfaced in the workflow audit. Update status as buckets land.

## Bucket A — Workflow integrity (in progress)
- [x] G1 — Rejected verification: add Resubmit path
- [x] G4 — `/explore` gated behind verification
- [x] G5 — Story `city_id` stored (UUID) instead of free-text city name
- [x] G13 — `/author/:id` filtered to `status = 'approved'`
- [x] Cleanup — remove vestigial `_inviteCode` param in `useAuth.signUp` (invite codes deprecated)

## Bucket B — Trust & safety (in QA)
- [x] G2 — Real account deletion via `delete-account` edge function (cascades all FKs)
- [x] G3 — Privacy settings persisted to `user_preferences` JSONB; vapor toggles removed
- [x] G8 — Feed queries (`useStories`, `useInfiniteStories`, `useStoriesByCity`) exclude blocked users
- [x] G14 — `/admin/reports` page + sidebar link; admins can mark reviewing / action / dismiss

## Bucket C — Admin UX (queued)
- [ ] G7 — Rejection email on verification reject
- [ ] G15 — Admin nav links (visible only to admins)
- [ ] G16 — Admin delete actions on posts / users
- [ ] Bulk-reject in AdminPosts (with reason)

## Bucket D — Polish (queued)
- [ ] G10 — `/activity` deep link auto-opens story on Explore
- [ ] G11 — Real "Edit profile" form (username/bio)
- [ ] G19 — Remove dead `/codename/:id` route
- [ ] G22 — Seed feed empty state
- [ ] G23 — `submitted_anonymously` toggle in CreateStory (decide intent)

## Verification protocol
After each bucket lands, spawn a QA agent to trace each item end-to-end and confirm no regressions before moving to the next bucket.