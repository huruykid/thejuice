import { useAuth } from "@/hooks/useAuth";
import { useRealIsAdmin } from "@/hooks/useRealIsAdmin";
import { useViewAs, ViewAsMode } from "@/contexts/ViewAsContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<Exclude<ViewAsMode, null>, string> = {
  logged_out: "Logged-out visitor",
  unverified_user: "Unverified user",
  verified_user: "Verified user",
};

export const ViewAsBar = () => {
  // We intentionally read `session` from auth which may be overridden, but for
  // the admin check we use the real role so the bar still shows in preview mode.
  const { session } = useAuth();
  // Use stored session.user if present, else nothing — but session can be null
  // when previewing logged_out. We need the *real* user id; pull from supabase
  // directly via the real-admin hook by reading from session OR from window.
  const realUserId = session?.user?.id;
  const { isAdmin: realIsAdmin } = useRealIsAdmin(realUserId);
  const { viewAs, setViewAs } = useViewAs();

  // Don't render until we know the user is a real admin.
  if (!realIsAdmin && viewAs === null) return null;

  // If admin is currently previewing logged_out, session is null so realUserId
  // would be undefined and realIsAdmin would be false. Fall back to trusting
  // `viewAs !== null` (only an admin could have set it).
  const active = viewAs !== null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg backdrop-blur",
        active
          ? "border-amber-400 bg-amber-100/95 text-amber-900"
          : "border-border bg-card/95 text-foreground"
      )}
    >
      <Eye className="h-4 w-4 shrink-0" />
      <span className="text-xs font-medium whitespace-nowrap">
        {active ? `Previewing: ${LABELS[viewAs!]}` : "Viewing as Admin"}
      </span>
      <Select
        value={viewAs ?? "admin"}
        onValueChange={(v) =>
          setViewAs(v === "admin" ? null : (v as Exclude<ViewAsMode, null>))
        }
      >
        <SelectTrigger className="h-7 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin (real)</SelectItem>
          <SelectItem value="verified_user">Verified user</SelectItem>
          <SelectItem value="unverified_user">Unverified user</SelectItem>
          <SelectItem value="logged_out">Logged-out visitor</SelectItem>
        </SelectContent>
      </Select>
      {active && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          aria-label="Exit preview"
          onClick={() => setViewAs(null)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

export default ViewAsBar;