import { supabase } from "@/integrations/supabase/client";

/**
 * Activation/retention instrumentation (Phase 0).
 *
 * Fire-and-forget event logging into public.analytics_events. We only need enough signal
 * to answer two questions cheaply:
 *   1. Are real (non-seed) posts growing week over week?
 *   2. Do new users come back in their first week?
 *
 * Design notes:
 *  - Never throws / never blocks UI: failures are swallowed (analytics must not break flows).
 *  - Only logs for signed-in users (RLS requires user_id = auth.uid()); anonymous events are
 *    dropped rather than erroring.
 *  - `app_open` is de-duped to once per browser session so retention cohorts aren't inflated.
 */
export type AnalyticsEvent =
  | "app_open"
  | "signup"
  | "verification_submitted"
  | "post_created"
  | "search_miss"          // user searched a name with no results (drives the email nudge)
  | "search_miss_emailed"; // server: we sent the "be the first" nudge for that name

export async function track(event: AnalyticsEvent, props?: Record<string, unknown>): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return; // RLS would reject; skip anonymous.
    await (supabase as any).from("analytics_events").insert({
      user_id: userId,
      event,
      props: props ?? null,
    });
  } catch {
    // Analytics is best-effort — never surface errors to the user.
  }
}

/** Logs app_open at most once per browser session. */
export function trackAppOpenOnce(): void {
  try {
    const KEY = "juice_app_open_logged";
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, "1");
    void track("app_open");
  } catch {
    void track("app_open");
  }
}
