import { describe, it, expect } from "vitest";
import {
  visibleSubmissions,
  submissionStatusLabel,
  submissionStatusHint,
  PINNED_SUBMISSION_LIMIT,
  type Submission,
} from "@/lib/submissions";

const sub = (
  id: string,
  status: Submission["status"],
  rejection_reason: string | null = null
): Submission => ({
  id,
  content: `story ${id}`,
  status,
  created_at: "2026-08-11T15:10:35.930Z",
  image_url: "https://example.test/img.jpg",
  rejection_reason,
});

describe("visibleSubmissions", () => {
  it("returns everything, in order, for the full variant", () => {
    const subs = [sub("a", "pending"), sub("b", "approved"), sub("c", "rejected")];
    expect(visibleSubmissions(subs, "full").map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("drops approved posts from the pinned strip — the feed already shows them", () => {
    const subs = [sub("a", "pending"), sub("b", "approved"), sub("c", "rejected")];
    expect(visibleSubmissions(subs, "pinned").map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("caps the pinned strip so it can't crowd out the feed", () => {
    const subs = Array.from({ length: 10 }, (_, i) => sub(String(i), "pending"));
    expect(visibleSubmissions(subs, "pinned")).toHaveLength(PINNED_SUBMISSION_LIMIT);
  });

  it("handles an empty history without throwing", () => {
    expect(visibleSubmissions([], "pinned")).toEqual([]);
    expect(visibleSubmissions([], "full")).toEqual([]);
  });
});

describe("submission status copy", () => {
  it("labels each status", () => {
    expect(submissionStatusLabel("pending")).toBe("In review");
    expect(submissionStatusLabel("approved")).toBe("Live");
    expect(submissionStatusLabel("rejected")).toBe("Not approved");
  });

  it("promises the review email on pending", () => {
    expect(submissionStatusHint("pending", null)).toMatch(/email you/i);
  });

  it("surfaces the rejection reason when there is one", () => {
    expect(submissionStatusHint("rejected", "Duplicate of another post")).toContain(
      "Duplicate of another post"
    );
  });

  it("stays useful when a rejection has no recorded reason", () => {
    const hint = submissionStatusHint("rejected", null);
    expect(hint).toMatch(/post again/i);
    expect(hint).not.toMatch(/reason/i);
  });
});
