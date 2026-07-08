import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isPasswordLeaked } from "../passwordCheck";

/** SHA-1 of the password, uppercase hex, split into HIBP prefix/suffix. */
async function hashParts(password: string) {
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(password)
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return { prefix: hex.slice(0, 5), suffix: hex.slice(5) };
}

const mockFetch = (body: string, ok = true) =>
  vi.fn(async (_url: string, _init?: RequestInit) => ({ ok, text: async () => body }) as Response);

describe("isPasswordLeaked", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("returns true when the suffix appears with a nonzero count", async () => {
    const { suffix } = await hashParts("password123");
    global.fetch = mockFetch(`AAAAA:0\n${suffix}:12345\nBBBBB:2`);
    expect(await isPasswordLeaked("password123")).toBe(true);
  });

  it("returns false when the suffix is absent", async () => {
    global.fetch = mockFetch("AAAAA:3\nBBBBB:7");
    expect(await isPasswordLeaked("gx!91-completely-unique-77")).toBe(false);
  });

  it("treats padded zero-count entries as not leaked", async () => {
    const { suffix } = await hashParts("padded-entry-pw");
    global.fetch = mockFetch(`${suffix}:0`);
    expect(await isPasswordLeaked("padded-entry-pw")).toBe(false);
  });

  it("fails open when the API errors", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    });
    expect(await isPasswordLeaked("whatever")).toBe(false);
  });

  it("fails open on a non-OK response", async () => {
    global.fetch = mockFetch("", false);
    expect(await isPasswordLeaked("whatever")).toBe(false);
  });

  it("sends only the 5-character hash prefix, never the password", async () => {
    const { prefix } = await hashParts("secret-password");
    const spy = mockFetch("AAAAA:1");
    global.fetch = spy;
    await isPasswordLeaked("secret-password");
    const calledUrl = spy.mock.calls[0][0];
    expect(calledUrl).toBe(`https://api.pwnedpasswords.com/range/${prefix}`);
    expect(calledUrl).not.toContain("secret-password");
  });
});
