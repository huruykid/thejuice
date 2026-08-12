import { Eye, X } from "lucide-react";
import { useRealAdmin } from "@/hooks/useRealAdmin";
import { useViewAs, ViewAsMode } from "@/contexts/ViewAsContext";

const LABELS: Record<Exclude<ViewAsMode, null>, string> = {
  logged_out: "logged-out visitor",
  unverified_user: "unverified user",
  verified_user: "verified user",
};

/**
 * The exit hatch for an active "Preview as" session — and nothing else.
 *
 * It used to render permanently, including a full role picker, which meant an
 * always-on bar sitting over the bottom-right of the feed for the ~99% of the time
 * nobody was previewing anything. The picker now lives in the admin menus
 * (ViewAsMenu); this is what remains, and only while a preview is running.
 *
 * It cannot move into a menu itself. Previewing the logged-out visitor takes away
 * the sidebar, the bottom nav, and /admin (useAuth reports no user, so AdminRoute
 * bounces to login) — with no floating control there is no way back out short of
 * clearing sessionStorage by hand.
 *
 * Sits bottom-LEFT: the create button and the feed's action row own the right side,
 * and `bottom-16` clears the mobile bottom nav where one is rendered.
 */
export const ViewAsBar = () => {
  const { isAdmin: realIsAdmin } = useRealAdmin();
  const { viewAs, setViewAs } = useViewAs();

  if (!realIsAdmin || viewAs === null) return null;

  return (
    <button
      type="button"
      onClick={() => setViewAs(null)}
      aria-label={`Exit preview — you are viewing as a ${LABELS[viewAs]}`}
      className="fixed bottom-16 left-3 lg:bottom-4 lg:left-4 z-[60] flex items-center gap-1.5 rounded-full border border-primary bg-card/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-muted"
    >
      <Eye className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="whitespace-nowrap">Previewing: {LABELS[viewAs]}</span>
      <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
};

export default ViewAsBar;
