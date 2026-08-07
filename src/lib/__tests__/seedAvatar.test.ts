import { describe, it, expect } from "vitest";
import { hashSeed, dicebearUrl } from "@/lib/seedAvatar";
import { SEED_STORY_LIBRARY } from "@/lib/seedStoryLibrary";

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed("Hinge Harper")).toBe(hashSeed("Hinge Harper"));
  });

  it("separates different seeds", () => {
    expect(hashSeed("Hinge Harper")).not.toBe(hashSeed("Bumble Bex"));
  });

  it("stays inside unsigned 32-bit range", () => {
    for (const s of ["", "a", "Hinge Harper", "x".repeat(500)]) {
      const h = hashSeed(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("dicebearUrl", () => {
  it("is stable for a given seed", () => {
    expect(dicebearUrl("Hinge Hana")).toBe(dicebearUrl("Hinge Hana"));
  });

  it("encodes seeds containing spaces and separators", () => {
    const url = dicebearUrl("Hinge Hana|she showed up");
    expect(url).not.toMatch(/[ |]/);
    expect(url).toContain("Hinge%20Hana");
  });

  it("spreads seeds across more than one style", () => {
    const styles = new Set(
      SEED_STORY_LIBRARY.map((s) => dicebearUrl(s.subject_name).split("/9.x/")[1].split("/")[0])
    );
    expect(styles.size).toBeGreaterThan(1);
  });
});

describe("SEED_STORY_LIBRARY", () => {
  it("has content, subject and location on every entry", () => {
    for (const s of SEED_STORY_LIBRARY) {
      expect(s.content.trim().length).toBeGreaterThan(50);
      expect(s.subject_name.trim()).not.toBe("");
      expect(s.location.trim()).toMatch(/^.+,\s*[A-Z]{2}$/);
    }
  });

  it("uses only the -1/0/+1 verdict encoding the feed reads", () => {
    for (const s of SEED_STORY_LIBRARY) {
      expect([-1, 0, 1]).toContain(s.verdict);
    }
  });

  it("carries a mix of verdicts so the feed isn't one-note", () => {
    const counts = { milk: 0, none: 0, juice: 0 };
    for (const s of SEED_STORY_LIBRARY) {
      if (s.verdict < 0) counts.milk++;
      else if (s.verdict > 0) counts.juice++;
      else counts.none++;
    }
    expect(counts.milk).toBeGreaterThan(0);
    expect(counts.juice).toBeGreaterThan(0);
    expect(counts.none).toBeGreaterThan(0);
  });

  it("has no duplicate story text", () => {
    const seen = new Set(SEED_STORY_LIBRARY.map((s) => s.content));
    expect(seen.size).toBe(SEED_STORY_LIBRARY.length);
  });

  it("fits the bulk RPC's 50-row batch limit in one call", () => {
    expect(SEED_STORY_LIBRARY.length).toBeLessThanOrEqual(50);
  });
});
