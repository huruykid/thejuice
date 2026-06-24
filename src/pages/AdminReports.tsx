import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Flag, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/hooks/useReports";

type StatusFilter = Report["status"] | "all";

interface ResolvedStory {
  id: string;
  content: string;
  subject_name: string | null;
}

interface ResolvedProfile {
  user_id: string;
  anonymous_username: string;
  city: string | null;
}

interface ReportWithContent extends Report {
  resolvedStory?: ResolvedStory;
  resolvedProfile?: ResolvedProfile;
}

const STATUS_STYLES: Record<Report["status"], string> = {
  pending: "bg-muted text-foreground",
  reviewing: "bg-primary/10 text-primary",
  action_taken: "bg-success/15 text-success",
  dismissed: "bg-muted text-muted-foreground",
};

const AdminReports = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>("pending");

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin-reports", filter],
    enabled: !!user && isAdmin,
    queryFn: async (): Promise<ReportWithContent[]> => {
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      const base = (data ?? []) as Report[];

      // Batch-resolve target content so the admin can see what was reported
      const storyIds = [...new Set(base.filter(r => r.target_type === "story").map(r => r.target_id))];
      const userIds  = [...new Set(base.filter(r => r.target_type === "user").map(r => r.target_id))];

      const [storiesResult, profilesResult] = await Promise.all([
        storyIds.length > 0
          ? supabase.from("stories").select("id, content, subject_name").in("id", storyIds)
          : Promise.resolve({ data: [] as ResolvedStory[], error: null }),
        userIds.length > 0
          ? supabase.from("profiles").select("user_id, anonymous_username, city").in("user_id", userIds)
          : Promise.resolve({ data: [] as ResolvedProfile[], error: null }),
      ]);

      const storyMap = Object.fromEntries((storiesResult.data ?? []).map(s => [s.id, s as ResolvedStory]));
      const profileMap = Object.fromEntries((profilesResult.data ?? []).map(p => [p.user_id, p as ResolvedProfile]));

      return base.map(r => ({
        ...r,
        resolvedStory:   r.target_type === "story" ? storyMap[r.target_id]   : undefined,
        resolvedProfile: r.target_type === "user"  ? profileMap[r.target_id] : undefined,
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id, status, actionTaken,
    }: { id: string; status: Report["status"]; actionTaken?: string }) => {
      const { error } = await supabase
        .from("reports")
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          action_taken: actionTaken ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
      toast.success("Report updated");
    },
    onError: () => toast.error("Failed to update report"),
  });

  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === "pending").length,
    [reports],
  );

  // Hooks must be called before any early return (Rules of Hooks).
  // Redirect non-admins once loading completes.
  useEffect(() => {
    if (!authLoading && !roleLoading && !isAdmin) {
      navigate("/app", { replace: true });
    }
  }, [authLoading, roleLoading, isAdmin, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="bg-gradient-soft p-4 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flag className="h-6 w-6 text-juice-orange" />
            <h1 className="text-2xl font-bold">Reports</h1>
            {filter === "pending" && pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount}</Badge>
            )}
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="action_taken">Action taken</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading reports…</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No reports in this view.</div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                onUpdate={(status, actionTaken) =>
                  updateStatus.mutate({ id: report.id, status, actionTaken })
                }
                disabled={updateStatus.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function ReportRow({
  report, onUpdate, disabled,
}: {
  report: ReportWithContent;
  onUpdate: (status: Report["status"], actionTaken?: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{report.target_type}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[report.status]}`}>
              {report.status.replace("_", " ")}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Report reason */}
        <p className="text-sm font-medium">{report.reason}</p>
        {report.details && (
          <p className="text-sm text-muted-foreground">{report.details}</p>
        )}

        {/* Resolved target content — the actual thing being reported */}
        {report.resolvedStory && (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Reported story{report.resolvedStory.subject_name ? ` — about "${report.resolvedStory.subject_name}"` : ""}
            </p>
            <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
              {report.resolvedStory.content}
            </p>
          </div>
        )}
        {report.resolvedProfile && (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Reported user</p>
            <p className="text-sm font-medium">{report.resolvedProfile.anonymous_username}</p>
            {report.resolvedProfile.city && (
              <p className="text-xs text-muted-foreground">{report.resolvedProfile.city}</p>
            )}
          </div>
        )}
        {!report.resolvedStory && !report.resolvedProfile && (
          <p className="text-xs text-muted-foreground font-mono break-all">
            target: {report.target_id}
          </p>
        )}

        {report.action_taken && (
          <p className="text-xs text-emerald-700">Action: {report.action_taken}</p>
        )}

        {/* Actions */}
        {report.status === "pending" && (
          <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdate("reviewing")}
              disabled={disabled}
            >
              Mark reviewing
            </Button>
            <Button
              size="sm"
              onClick={() => onUpdate("action_taken", "Content removed or user warned")}
              disabled={disabled}
            >
              Action taken
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdate("dismissed", "No violation found")}
              disabled={disabled}
            >
              Dismiss
            </Button>
          </div>
        )}
        {report.status === "reviewing" && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <Button
              size="sm"
              onClick={() => onUpdate("action_taken", "Content removed or user warned")}
              disabled={disabled}
            >
              Action taken
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onUpdate("dismissed", "No violation found")}
              disabled={disabled}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AdminReports;
