import { Eye } from "lucide-react";
import { useRealAdmin } from "@/hooks/useRealAdmin";
import { useViewAs, ViewAsMode } from "@/contexts/ViewAsContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * "Preview as" picker, for placement inside admin menus.
 *
 * This is the way IN to a preview. The way OUT is ViewAsBar, which is the only
 * thing that stays on screen while previewing — by design, since previewing a
 * logged-out visitor removes every menu this control could live in.
 *
 * Hidden while a preview is active, for the same reason the rest of the admin
 * chrome is: a preview that still shows you admin controls isn't a preview.
 */
const ViewAsMenu = ({ className = "" }: { className?: string }) => {
  const { isAdmin: realIsAdmin } = useRealAdmin();
  const { viewAs, setViewAs } = useViewAs();

  if (!realIsAdmin || viewAs !== null) return null;

  return (
    // Layout-neutral by default — each menu supplies its own spacing.
    <div className={className}>
      <label
        htmlFor="view-as-select"
        className="flex items-center gap-2 text-sm text-foreground/80 mb-1.5"
      >
        <Eye className="h-4 w-4" />
        Preview as
      </label>
      <Select
        value="admin"
        onValueChange={(v) =>
          setViewAs(v === "admin" ? null : (v as Exclude<ViewAsMode, null>))
        }
      >
        <SelectTrigger id="view-as-select" className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin (you)</SelectItem>
          <SelectItem value="verified_user">Verified user</SelectItem>
          <SelectItem value="unverified_user">Unverified user</SelectItem>
          <SelectItem value="logged_out">Logged-out visitor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ViewAsMenu;
