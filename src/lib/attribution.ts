/**
 * Acquisition attribution + referral links (growth round 1, see GROWTH_EXPERIMENTS.md).
 *
 * Problem: 344 of 350 members never answered "how did you hear about us?", so we have no
 * idea which channel produces posters. This captures what the browser already knows on
 * the first page load — `?ref=` (a member's invite link), `utm_*`, and the referrer host —
 * and attaches it to the `signup` event, so the funnel can be cut by source without
 * asking anyone anything.
 *
 * Referral codes are derived from the member's user id (first 8 hex chars), so there is
 * no table, no generator, and nothing to leak: the code identifies the *inviter* only to
 * us, and only as "some member". Nothing here goes to GA.
 */

const KEY = "juice_attribution_v1";

export interface Attribution {
  ref?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referrer_host?: string;
  landing_path?: string;
  captured_at: string;
}

const SELF_HOSTS = new Set(["sipjuice.app", "www.sipjuice.app", "teaappformen.com", "localhost"]);

/** Pure parser: what a first touch looks like from a URL + referrer. Null = direct traffic. */
export function parseAttribution(search: string, referrer: string, pathname: string, now = new Date()): Attribution | null {
  const params = new URLSearchParams(search);
  const a: Attribution = { captured_at: now.toISOString() };
  const ref = params.get("ref")?.trim();
  if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) a.ref = ref.toLowerCase();
  for (const k of ["utm_source", "utm_medium", "utm_campaign"] as const) {
    const v = params.get(k)?.trim();
    if (v) a[k] = v.slice(0, 64);
  }
  try {
    const host = referrer ? new URL(referrer).hostname : "";
    if (host && !SELF_HOSTS.has(host)) a.referrer_host = host;
  } catch {
    /* malformed referrer */
  }
  a.landing_path = pathname.slice(0, 120);
  // Only worth keeping when there's something to attribute; direct traffic stays direct.
  return a.ref || a.utm_source || a.referrer_host ? a : null;
}

/** Reads ?ref / utm_* / document.referrer once and keeps the FIRST touch. Safe to call every load. */
export function captureAttribution(): Attribution | null {
  try {
    if (typeof window === "undefined") return null;
    const existing = window.localStorage.getItem(KEY);
    if (existing) return JSON.parse(existing) as Attribution;
    const a = parseAttribution(window.location.search, document.referrer, window.location.pathname);
    if (a) window.localStorage.setItem(KEY, JSON.stringify(a));
    return a;
  } catch {
    return null;
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

/** Props to attach to the `signup` event — never the user's own identity, only the source. */
export function attributionProps(): Record<string, unknown> {
  const a = getAttribution();
  if (!a) return {};
  const { captured_at: _c, ...rest } = a;
  return rest;
}

/** A member's referral code: stable, short, unguessable-enough, and not their handle. */
export function refCodeFor(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toLowerCase();
}

export const APP_ORIGIN = "https://sipjuice.app";

/** Landing link with the member's ref attached. */
export function inviteUrl(userId: string, path = "/"): string {
  const url = new URL(path, APP_ORIGIN);
  url.searchParams.set("ref", refCodeFor(userId));
  return url.toString();
}
