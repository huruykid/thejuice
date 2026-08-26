import { supabase } from "@/integrations/supabase/client";

/**
 * Activation/retention instrumentation.
 *
 * Two sinks, one call:
 *  1. public.analytics_events (Supabase) — the source of truth for the funnel. Fire-and-forget,
 *     signed-in users only (RLS requires user_id = auth.uid()), never throws.
 *  2. Google Analytics (gtag, loaded in index.html) — so the GA Reports snapshot can show the
 *     funnel instead of just page views. Before this, GA had only automatic events (page_view,
 *     scroll, form_start) and no way to tell that nothing converts.
 *
 * PII rule for GA: subject names are real people. They go to Supabase (`props`) for the
 * search-miss nudge and never to GA — GA gets `search` with hit/miss only.
 *
 * `app_open` is de-duped to once per browser session so retention cohorts aren't inflated.
 */
export type AnalyticsEvent =
  | "app_open"
  | "signup"
  | "verification_submitted"
  | "verification_approved" // client: first time this browser sees the account approved
  | "review_started"        // composer opened (with or without a prefilled name)
  | "post_created"
  | "search_hit"            // user searched a name and something came back
  | "search_miss"           // user searched a name with no results (drives the email nudge)
  | "search_miss_emailed";  // server: we sent the "be the first" nudge for that name

/**
 * GA event names. `sign_up` is GA's recommended name; `search` is GA's too, but we
 * deliberately omit its `search_term` param (see the PII rule above).
 * Mark `review_submitted` as a key event in GA admin — that's the conversion.
 */
const GA_EVENT: Partial<Record<AnalyticsEvent, string>> = {
  signup: "sign_up",
  verification_submitted: "verification_submitted",
  verification_approved: "verification_approved",
  review_started: "review_started",
  post_created: "review_submitted",
  search_hit: "search",
  search_miss: "search",
};

/** Props that are safe to forward to GA, per event. Everything else stays in Supabase. */
const GA_PARAMS: Partial<Record<AnalyticsEvent, (props?: Record<string, unknown>) => Record<string, unknown>>> = {
  search_hit: () => ({ result: "hit" }),
  search_miss: () => ({ result: "miss" }),
  review_started: (p) => ({ prefilled: p?.prefilled ? 1 : 0, verified: p?.verified ? 1 : 0 }),
  post_created: (p) => ({ has_subject: p?.has_subject ? 1 : 0, verified: p?.verified ? 1 : 0 }),
};

type Gtag = (...args: unknown[]) => void;

/** Sends an event to GA if gtag is loaded (it isn't in tests, previews, or with blockers). */
export function gaEvent(name: string, params?: Record<string, unknown>): void {
  try {
    const gtag = (globalThis as unknown as { gtag?: Gtag }).gtag;
    if (typeof gtag === "function") gtag("event", name, params ?? {});
  } catch {
    // Analytics is best-effort — never surface errors to the user.
  }
}

export async function track(event: AnalyticsEvent, props?: Record<string, unknown>): Promise<void> {
  const gaName = GA_EVENT[event];
  if (gaName) gaEvent(gaName, GA_PARAMS[event]?.(props));

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
