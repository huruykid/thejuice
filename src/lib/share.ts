import { track } from "@/lib/analytics";
import { inviteUrl } from "@/lib/attribution";

/**
 * One share primitive for every growth surface. Native share sheet where it exists
 * (iOS/Android PWA), clipboard everywhere else. Logs `share_clicked` with the surface so
 * the funnel can tell which moment actually spreads the app.
 *
 * Returns "shared" | "copied" | "cancelled" | "failed" so callers can show honest feedback.
 */
export type ShareSurface = "miss" | "post" | "home" | "profile";

export async function shareInvite(opts: {
  userId: string;
  surface: ShareSurface;
  text: string;
  path?: string;
}): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const url = inviteUrl(opts.userId, opts.path);
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  try {
    if (nav?.share) {
      void track("share_clicked", { surface: opts.surface, method: "native" });
      await nav.share({ text: opts.text, url });
      return "shared";
    }
    if (nav?.clipboard?.writeText) {
      void track("share_clicked", { surface: opts.surface, method: "copy" });
      await nav.clipboard.writeText(`${opts.text} ${url}`);
      return "copied";
    }
    return "failed";
  } catch (e) {
    // The native sheet rejects with AbortError when the user backs out — not a failure.
    if ((e as { name?: string })?.name === "AbortError") return "cancelled";
    return "failed";
  }
}
