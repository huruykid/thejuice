import type { ViewAsMode } from "@/contexts/ViewAsContext";

/**
 * The preview that is actually in effect.
 *
 * The stored mode is just a sessionStorage string (`juice:viewAs`) — anyone can type
 * one into their own devtools. This function is the single gate that makes doing so
 * inert: without a real admin role the answer is always null, so every consumer that
 * routes through it ignores the value entirely.
 *
 * Note which direction the override runs. A preview only ever *removes* capability —
 * roles collapse to `[]` or `['user']`, verification reads false, the user reads null.
 * Nothing here can grant anything, so the worst an admin can do to themselves is see
 * less than they're entitled to. The real enforcement is Postgres RLS regardless;
 * this is presentation only.
 */
export const activePreview = (realIsAdmin: boolean, viewAs: ViewAsMode): ViewAsMode =>
  realIsAdmin ? viewAs : null;
