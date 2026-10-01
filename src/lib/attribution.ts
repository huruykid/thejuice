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

/**
 * Hosts a sign-in round-trip passes through. Coming back from Google's consent screen is
 * not a referral: without this, every direct visitor who signs in with Google would be
 * recorded as "referred by accounts.google.com" on the reload after the redirect.
 */
const AUTH_HOSTS = new Set(["accounts.google.com", "appleid.apple.com"]);
const isAuthHost = (host: string) => AUTH_HOSTS.has(host) || host.endsWith(".supabase.co");

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
    if (host && !SELF_HOSTS.has(host) && !isAuthHost(host)) a.referrer_host = host;
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

/**
 * How long after account creation a first authenticated session still counts as "the
 * signup". Wide enough for an email-confirmation round-trip later the same day; narrow
 * enough that an old member signing in on a new browser isn't logged as a new signup.
 */
export const SIGNUP_WINDOW_MS = 24 * 60 * 60 * 1000;

const signupLoggedKey = (userId: string) => `juice_signup_logged_${userId}`;

/** Pure: is this account young enough for its current session to be its signup? */
export function isFreshAccount(createdAt: string | undefined | null, now = Date.now(), windowMs = SIGNUP_WINDOW_MS): boolean {
  if (!createdAt) return false;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return false;
  const age = now - t;
  // Small negative ages are clock skew between the device and the auth server.
  return age > -5 * 60 * 1000 && age <= windowMs;
}

/**
 * Decides whether to log `signup` for this account in this browser, and claims the slot
 * so it's logged once. Returns the props to send, or null when there's nothing to log.
 *
 * This runs on the first authenticated session rather than inside the email sign-up
 * handler because Google sign-in leaves the page and comes back: the handler never
 * resumes, so (until 2026-10-01) no Google signup carried a source — 18 of 26 new
 * accounts in the first week of measurement.
 */
export function claimSignupEvent(
  user: { id: string; created_at?: string | null; app_metadata?: { provider?: string } | null },
  now = Date.now(),
): Record<string, unknown> | null {
  if (!isFreshAccount(user.created_at, now)) return null;
  try {
    const key = signupLoggedKey(user.id);
    if (window.localStorage.getItem(key)) return null;
    window.localStorage.setItem(key, "1");
  } catch {
    // Private mode: storage is unavailable, so we can't de-dupe. Logging a duplicate is
    // better than logging nothing — the funnel counts distinct users.
  }
  const provider = user.app_metadata?.provider;
  return { ...attributionProps(), ...(provider ? { provider } : {}) };
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
