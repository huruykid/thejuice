import { useState, useMemo } from "react";
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
import { ArrowLeft, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Report } from "@/hooks/useReports";

type StatusFilter = Report["status"] | "all";

const STATUS_STYLES: Record<Report["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  action_taken: "bg-emerald-100 text-emerald-800",
  dismissed: "bg-gray-100 text-gray-700",
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
    queryFn: async (): Promise<Report[]> => {
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Report[];
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
      toast.success("Report updated");
    },
    onError: () => toast.error("Failed to update report"),
  });

  const pendingCount = useMemo(
    () => reports.filter((r) => r.status === "pending").length,
    [reports],
  );

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/not-found", { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Flag className="h-6 w-6 text-juice-orange" />
              <h1 className="text-2xl font-bold">Reports</h1>
              {filter === "pending" && pendingCount > 0 && (
                <Badge variant="secondary">{pendingCount}</Badge>
              )}
            </div>
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
  report: Report;
  onUpdate: (status: Report["status"], actionTaken?: string) => void;
  disabled: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{report.target_type}</Badge>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[report.status]}`}>
              {report.status.replace("_", " ")}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(report.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm font-medium">{report.reason}</p>
          {report.details && (
            <p className="text-sm text-muted-foreground line-clamp-3">{report.details}</p>
          )}
          <p className="text-xs text-muted-foreground font-mono break-all">
            target: {report.target_id}
          </p>
          {report.action_taken && (
            <p className="text-xs text-emerald-700">Action: {report.action_taken}</p>
          )}
        </div>
      </div>

      {report.status === "pending" && (
        <div className="flex gap-2 mt-3 pt-3 border-t">
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
        <div className="flex gap-2 mt-3 pt-3 border-t">
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
    </Card>
  );
}

export default AdminReports;