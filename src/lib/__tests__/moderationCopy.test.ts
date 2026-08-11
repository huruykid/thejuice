import { describe, it, expect } from "vitest";
import {
  describeModeration,
  mergeModerationResults,
  type ModerationResult,
} from "@/lib/moderationCopy";

const result = (over: Partial<ModerationResult> = {}): ModerationResult => ({
  updated: 1,
  unchanged: 0,
  emailed: 1,
  skippedAnonymous: 0,
  skippedOptout: 0,
  skippedNoEmail: 0,
  failed: [],
  ...over,
});

describe("describeModeration", () => {
  it("reports a single approval with its email", () => {
    expect(describeModeration("approve", result())).toBe("Post approved — author emailed");
  });

  it("reports a single rejection with its email", () => {
    expect(describeModeration("reject", result())).toBe("Post rejected — author emailed");
  });

  it("counts authors on a bulk action", () => {
    expect(describeModeration("approve", result({ updated: 5, emailed: 5 }))).toBe(
      "5 posts approved — 5 authors emailed"
    );
  });

  it("never claims an email for an anonymous post", () => {
    const msg = describeModeration("approve", result({ emailed: 0, skippedAnonymous: 1 }));
    expect(msg).toBe("Post approved — anonymous post — no author to email");
    expect(msg).not.toMatch(/emailed/);
  });

  it("says so when the author has unsubscribed", () => {
    expect(describeModeration("reject", result({ emailed: 0, skippedOptout: 1 }))).toMatch(
      /unsubscribed/
    );
  });

  it("says so when there's no address on file", () => {
    expect(describeModeration("approve", result({ emailed: 0, skippedNoEmail: 1 }))).toMatch(
      /no email on file/
    );
  });

  it("surfaces a failed send rather than reporting success", () => {
    const msg = describeModeration("approve", result({ emailed: 0, failed: ["abc"] }));
    expect(msg).toBe("Post approved — email failed to send");
  });

  it("reports partial failure in a bulk send", () => {
    const msg = describeModeration("approve", result({ updated: 3, emailed: 2, failed: ["c"] }));
    expect(msg).toBe("3 posts approved — 2 emailed, 1 failed");
  });

  it("does not re-announce a no-op", () => {
    expect(describeModeration("approve", result({ updated: 0, unchanged: 1, emailed: 0 }))).toBe(
      "No change — already approved"
    );
  });

  it("omits the email clause when there is nothing to say", () => {
    expect(describeModeration("approve", result({ emailed: 0 }))).toBe("Post approved");
  });
});

describe("mergeModerationResults", () => {
  it("sums a chunked bulk action into one result", () => {
    const merged = mergeModerationResults([
      result({ updated: 100, emailed: 98, skippedOptout: 2, failed: [] }),
      result({ updated: 40, emailed: 39, skippedAnonymous: 1, failed: ["z"] }),
    ]);
    expect(merged).toEqual({
      updated: 140,
      unchanged: 0,
      emailed: 137,
      skippedAnonymous: 1,
      skippedOptout: 2,
      skippedNoEmail: 0,
      failed: ["z"],
    });
  });

  it("returns a zeroed result for no batches", () => {
    expect(mergeModerationResults([])).toEqual({
      updated: 0,
      unchanged: 0,
      emailed: 0,
      skippedAnonymous: 0,
      skippedOptout: 0,
      skippedNoEmail: 0,
      failed: [],
    });
  });
});
