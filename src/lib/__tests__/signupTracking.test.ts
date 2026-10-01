import { describe, it, expect, beforeEach, vi } from "vitest";
import { claimSignupEvent, isFreshAccount, parseAttribution, SIGNUP_WINDOW_MS } from "../attribution";

const NOW = Date.parse("2026-10-01T21:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

/** Minimal localStorage for the node test environment. */
function installStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
  vi.stubGlobal("window", { localStorage });
  return store;
}

describe("signup tracking", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats an account as fresh only inside the signup window", () => {
    expect(isFreshAccount(minutesAgo(1), NOW)).toBe(true);
    expect(isFreshAccount(minutesAgo(23 * 60), NOW)).toBe(true);
    expect(isFreshAccount(new Date(NOW - SIGNUP_WINDOW_MS - 1).toISOString(), NOW)).toBe(false);
    // A March member signing in on a new browser is not a signup.
    expect(isFreshAccount("2026-03-19T05:15:08Z", NOW)).toBe(false);
    expect(isFreshAccount(undefined, NOW)).toBe(false);
    expect(isFreshAccount("not a date", NOW)).toBe(false);
  });

  it("tolerates small clock skew but not a created_at far in the future", () => {
    expect(isFreshAccount(minutesAgo(-2), NOW)).toBe(true);
    expect(isFreshAccount(minutesAgo(-60), NOW)).toBe(false);
  });

  it("logs a Google signup with the stored first-touch source and the provider", () => {
    installStorage({
      juice_attribution_v1: JSON.stringify({
        utm_source: "chatgpt.com",
        landing_path: "/tea-app-comparison",
        captured_at: minutesAgo(5),
      }),
    });
    const props = claimSignupEvent(
      { id: "u-google", created_at: minutesAgo(1), app_metadata: { provider: "google" } },
      NOW,
    );
    expect(props).toEqual({ utm_source: "chatgpt.com", landing_path: "/tea-app-comparison", provider: "google" });
  });

  it("logs a direct signup with just the provider, and only once per browser", () => {
    const store = installStorage();
    const user = { id: "u-direct", created_at: minutesAgo(1), app_metadata: { provider: "email" } };
    expect(claimSignupEvent(user, NOW)).toEqual({ provider: "email" });
    expect(store.get("juice_signup_logged_u-direct")).toBe("1");
    expect(claimSignupEvent(user, NOW)).toBeNull();
  });

  it("does not log or claim anything for an existing member", () => {
    const store = installStorage();
    expect(claimSignupEvent({ id: "u-old", created_at: "2026-03-19T05:15:08Z" }, NOW)).toBeNull();
    expect(store.has("juice_signup_logged_u-old")).toBe(false);
  });

  it("still logs when storage is unavailable (private mode)", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
      },
    });
    expect(claimSignupEvent({ id: "u-private", created_at: minutesAgo(1), app_metadata: { provider: "google" } }, NOW)).toEqual({
      provider: "google",
    });
  });

  it("does not count the sign-in round-trip as a referral", () => {
    expect(parseAttribution("", "https://accounts.google.com/", "/app")).toBeNull();
    expect(parseAttribution("", "https://mccehajzdnpkpusffhco.supabase.co/auth/v1/callback", "/app")).toBeNull();
    // A real referrer is still recorded.
    expect(parseAttribution("", "https://www.google.com/", "/")).toMatchObject({ referrer_host: "www.google.com" });
  });
});
