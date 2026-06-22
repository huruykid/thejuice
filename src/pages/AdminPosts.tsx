import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, UserX, User } from "lucide-react";
import { toast } from "sonner";

const REJECTION_REASONS = [
  { id: "identifying", label: "Names a real person identifiably" },
  { id: "fabricated", label: "Appears fabricated or exaggerated" },
  { id: "low_effort", label: "Low effort / not enough detail" },
  { id: "guidelines", label: "Violates community guidelines" },
  { id: "duplicate", label: "Duplicate of another post" },
];

interface PendingPost {
  id: string;
  content: string;
  subject_name: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  user_id: string | null;
  submitted_anonymously: boolean;
  rejection_reason: string | null;
  rejected_at: string | null;
  is_seed: boolean;
}

const AdminPosts = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending"
  );

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/not-found");
  }, [authLoading, roleLoading, isAdmin, user, navigate]);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts", filter],
    queryFn: async () => {
      let q = supabase
        .from("stories")
        .select(
          "id, content, subject_name, created_at, status, user_id, submitted_anonymously, rejection_reason, rejected_at, is_seed"
        )
        .eq("is_seed", false)
        .order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as PendingPost[];
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stories")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post approved");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (e: any) => toast.error(e?.message || "Approval failed"),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reasonLabel }: { id: string; reasonLabel: string }) => {
      const { error } = await supabase
        .from("stories")
        .update({
          status: "rejected",
          rejection_reason: reasonLabel,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post rejected");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (e: any) => toast.error(e?.message || "Rejection failed"),
  });

  if (authLoading || isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  if (!user || !isAdmin) return null;

  const badge = (s: string) => {
    if (s === "pending")
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-600">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    if (s === "approved")
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Post Moderation</h1>
            <p className="text-sm text-muted-foreground">
              Approve or reject pending stories — both from accounts and anonymous submissions.
            </p>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {(posts ?? []).map((p) => (
            <PostRow
              key={p.id}
              post={p}
              badge={badge}
              onApprove={() => approve.mutate(p.id)}
              onReject={(reasonLabel) => reject.mutate({ id: p.id, reasonLabel })}
            />
          ))}
          {(posts ?? []).length === 0 && (
            <Card>
              <CardContent className="text-center py-10 text-muted-foreground text-sm">
                Nothing in this queue.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const PostRow = ({
  post,
  badge,
  onApprove,
  onReject,
}: {
  post: PendingPost;
  badge: (s: string) => JSX.Element;
  onApprove: () => void;
  onReject: (reasonLabel: string) => void;
}) => {
  const [reasonId, setReasonId] = useState(REJECTION_REASONS[0].id);
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            {post.submitted_anonymously ? (
              <UserX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
            {post.subject_name || "(no subject)"}
            <span className="text-xs font-normal text-muted-foreground">
              · {new Date(post.created_at).toLocaleString()}
            </span>
          </CardTitle>
          {badge(post.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.rejection_reason && (
          <p className="text-xs text-red-600">
            Reason sent to user: {post.rejection_reason}
          </p>
        )}
        {post.status === "pending" && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <Button size="sm" onClick={onApprove}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger className="w-64 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                onReject(
                  REJECTION_REASONS.find((r) => r.id === reasonId)!.label
                )
              }
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPosts;