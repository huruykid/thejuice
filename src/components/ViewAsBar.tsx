import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  // Read the *real* session straight from Supabase so the bar still works when
  // an admin is previewing "logged_out" (which nulls out useAuth().user).
  const [realUserId, setRealUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setRealUserId(data.session?.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setRealUserId(session?.user?.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  const { isAdmin: realIsAdmin } = useRealIsAdmin(realUserId);
  const { viewAs, setViewAs } = useViewAs();

  // Don't render unless the real user is an admin.
  if (!realIsAdmin) return null;

  const active = viewAs !== null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full border px-3 py-2 shadow-lg backdrop-blur",
        active
          ? "border-primary bg-primary/10/95 text-amber-900"
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