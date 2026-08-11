/**
 * Types and admin-facing copy for post moderation. Kept free of the Supabase
 * client so the copy rules stay unit-testable without a DOM.
 */

export type ModerationAction = "approve" | "reject";

export interface ModerationResult {
  /** Rows that actually changed status (re-approving an approved post is a no-op). */
  updated: number;
  unchanged: number;
  emailed: number;
  /** Anonymous submissions have no account behind them to write to. */
  skippedAnonymous: number;
  skippedOptout: number;
  skippedNoEmail: number;
  /** Story ids whose email failed — the moderation still applied. */
  failed: string[];
}

/**
 * Ids per request. Must stay <= MAX_IDS in the moderate-post edge function,
 * which caps the blast radius of a single admin action; the admin queue can
 * hold more rows than that, so bulk actions are chunked.
 */
export const MODERATION_BATCH_SIZE = 100;

/** Fold chunked responses back into one result for a single toast. */
export function mergeModerationResults(results: ModerationResult[]): ModerationResult {
  return results.reduce<ModerationResult>(
    (acc, r) => ({
      updated: acc.updated + r.updated,
      unchanged: acc.unchanged + r.unchanged,
      emailed: acc.emailed + r.emailed,
      skippedAnonymous: acc.skippedAnonymous + r.skippedAnonymous,
      skippedOptout: acc.skippedOptout + r.skippedOptout,
      skippedNoEmail: acc.skippedNoEmail + r.skippedNoEmail,
      failed: [...acc.failed, ...r.failed],
    }),
    {
      updated: 0,
      unchanged: 0,
      emailed: 0,
      skippedAnonymous: 0,
      skippedOptout: 0,
      skippedNoEmail: 0,
      failed: [],
    }
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * Toast copy that matches what actually happened. The old UI said
 * "author notified" unconditionally while the notification went to a push
 * channel with zero registered tokens — so the one rule here is that we never
 * claim a send we didn't make.
 */
export function describeModeration(
  action: ModerationAction,
  result: ModerationResult
): string {
  const past = action === "approve" ? "approved" : "rejected";

  if (result.updated === 0) {
    return `No change — already ${past}`;
  }

  const base =
    result.updated === 1
      ? `Post ${past}`
      : `${plural(result.updated, "post")} ${past}`;

  const suffix = (): string | null => {
    if (result.failed.length > 0) {
      return result.emailed > 0
        ? `${result.emailed} emailed, ${result.failed.length} failed`
        : `email failed to send`;
    }
    if (result.emailed > 0) {
      return result.updated === 1 ? "author emailed" : `${plural(result.emailed, "author")} emailed`;
    }
    if (result.skippedAnonymous > 0) return "anonymous post — no author to email";
    if (result.skippedOptout > 0) return "author unsubscribed — no email sent";
    if (result.skippedNoEmail > 0) return "no email on file";
    return null;
  };

  const tail = suffix();
  return tail ? `${base} — ${tail}` : base;
}
