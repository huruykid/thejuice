import { describe, it, expect } from "vitest";
import { parseAttribution, refCodeFor, inviteUrl } from "../attribution";

describe("attribution", () => {
  it("captures ?ref and utm_* from the landing URL", () => {
    const a = parseAttribution("?ref=AbCd1234&utm_source=tiktok&utm_campaign=checkherfirst", "", "/");
    expect(a).toMatchObject({ ref: "abcd1234", utm_source: "tiktok", utm_campaign: "checkherfirst", landing_path: "/" });
  });

  it("rejects malformed ref codes and self-referrals — direct traffic stays direct", () => {
    expect(parseAttribution("?ref=<script>", "https://sipjuice.app/app", "/")).toBeNull();
    expect(parseAttribution("", "", "/how-it-works")).toBeNull();
  });

  it("records an external referrer host without the path", () => {
    expect(parseAttribution("", "https://www.reddit.com/r/dating/comments/abc", "/")).toMatchObject({
      referrer_host: "www.reddit.com",
    });
  });

  it("derives a stable 8-char ref code from the user id and builds the invite link", () => {
    const uid = "601F3D9A-5e69-46ff-89db-b3748ec82667";
    expect(refCodeFor(uid)).toBe("601f3d9a");
    expect(inviteUrl(uid)).toBe("https://sipjuice.app/?ref=601f3d9a");
    expect(inviteUrl(uid, "/how-it-works")).toBe("https://sipjuice.app/how-it-works?ref=601f3d9a");
  });
});
