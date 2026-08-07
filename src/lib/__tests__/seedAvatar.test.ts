import { describe, it, expect } from "vitest";
import { hashSeed, dicebearUrl } from "@/lib/seedAvatar";

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

  it("spreads different seeds across more than one style", () => {
    const styleOf = (s: string) => dicebearUrl(s).split("/9.x/")[1].split("/")[0];
    const styles = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"].map(styleOf)
    );
    expect(styles.size).toBeGreaterThan(1);
  });
});
