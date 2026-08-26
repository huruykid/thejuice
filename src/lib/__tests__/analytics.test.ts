import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// analytics.ts pulls in the Supabase client at import time; stub it so the test
// never touches the network and we can assert what gets written.
const insert = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    from: () => ({ insert }),
  },
}));

import { track, gaEvent } from "../analytics";

describe("analytics: GA mirror", () => {
  const gtag = vi.fn();
  beforeEach(() => {
    gtag.mockClear();
    insert.mockClear();
    (globalThis as unknown as { gtag?: unknown }).gtag = gtag;
  });
  afterEach(() => {
    delete (globalThis as unknown as { gtag?: unknown }).gtag;
  });

  it("never forwards a searched name to GA, only hit/miss", async () => {
    await track("search_miss", { name: "Jane Doe" });
    await track("search_hit", { name: "Jane Doe", results: 2 });

    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenNthCalledWith(1, "event", "search", { result: "miss" });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "search", { result: "hit" });
    for (const call of gtag.mock.calls) {
      expect(JSON.stringify(call)).not.toContain("Jane");
    }
    // …while Supabase still gets the name (it powers the search-miss nudge).
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ event: "search_miss", props: { name: "Jane Doe" } })
    );
  });

  it("maps funnel events to GA names with only whitelisted params", async () => {
    await track("signup");
    await track("verification_submitted");
    await track("verification_approved");
    await track("review_started", { prefilled: true, verified: false, source: "x" });
    await track("post_created", { story_id: "s1", has_subject: true, verified: false });

    expect(gtag.mock.calls.map((c) => c[1])).toEqual([
      "sign_up",
      "verification_submitted",
      "verification_approved",
      "review_started",
      "review_submitted",
    ]);
    expect(gtag).toHaveBeenCalledWith("event", "review_started", { prefilled: 1, verified: 0 });
    // story_id is an internal identifier — it stays out of GA.
    expect(gtag).toHaveBeenCalledWith("event", "review_submitted", { has_subject: 1, verified: 0 });
  });

  it("events without a GA mapping stay Supabase-only", async () => {
    await track("app_open");
    expect(gtag).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ event: "app_open" }));
  });

  it("is a no-op when gtag isn't loaded (blockers, previews, tests)", () => {
    delete (globalThis as unknown as { gtag?: unknown }).gtag;
    expect(() => gaEvent("search", { result: "miss" })).not.toThrow();
  });
});
