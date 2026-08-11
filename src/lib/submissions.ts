/**
 * Rules for showing an author their own submissions.
 *
 * A story is invisible to its author between submission and approval — the feed
 * queries filter `status = 'approved'`, so a post drops into a black hole the
 * moment it's sent. RLS has always allowed the author to read their own row at
 * any status ("Stories readable: own, seed, approved-for-verified, or admin");
 * these helpers decide which of those rows each surface renders.
 */

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Submission {
  id: string;
  content: string;
  status: SubmissionStatus;
  created_at: string;
  image_url: string | null;
  rejection_reason: string | null;
}

/**
 * - `full` — the whole history. UnverifiedHome, where this list is the only
 *   place an author's posts exist at all (they can't read the feed).
 * - `pinned` — the strip above the verified feed. Only what the feed can't
 *   show: pending and rejected. An approved post is already in the feed below,
 *   and listing it twice reads as a bug.
 */
export type SubmissionsVariant = "full" | "pinned";

/** Keep the pinned strip from crowding out the feed it sits on top of. */
export const PINNED_SUBMISSION_LIMIT = 3;

export function visibleSubmissions<T extends { status: SubmissionStatus }>(
  submissions: T[],
  variant: SubmissionsVariant
): T[] {
  if (variant === "full") return submissions;
  return submissions
    .filter((s) => s.status !== "approved")
    .slice(0, PINNED_SUBMISSION_LIMIT);
}

/**
 * What the author is told about a post's state. Deliberately process-based —
 * "in review" rather than "waiting for an admin" — and honest about the SLA we
 * actually promise in the approval email (24 hours).
 */
export function submissionStatusLabel(status: SubmissionStatus): string {
  switch (status) {
    case "pending":
      return "In review";
    case "approved":
      return "Live";
    case "rejected":
      return "Not approved";
  }
}

export function submissionStatusHint(
  status: SubmissionStatus,
  rejectionReason: string | null
): string | null {
  switch (status) {
    case "pending":
      return "Every story is read by a human before it goes live — usually within 24 hours. We'll email you.";
    case "approved":
      return "Live in the feed and searchable by name.";
    case "rejected":
      return rejectionReason
        ? `Reason: ${rejectionReason}. You're welcome to edit and post again.`
        : "You're welcome to edit and post again.";
  }
}
