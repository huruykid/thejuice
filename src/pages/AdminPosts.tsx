import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, UserX, User, Trash2, Mail } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import QueryError from "@/components/QueryError";
import { useConfirm } from "@/components/ConfirmDialog";
import { useStoryImageUrls } from "@/hooks/useStoryImageUrls";
import { sendPostRejectedNotification } from "@/lib/sendPushNotification";
import { moderatePosts, describeModeration } from "@/lib/moderatePost";
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
  image_url: string | null;
  location: string | null;
  overall_vibe_rating: number | null;
  profiles: { anonymous_username: string } | null;
}

const AdminPosts = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">(
    "pending"
  );
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkReasonId, setBulkReasonId] = useState<string>(REJECTION_REASONS[0].id);
  const { confirm, confirmDialog } = useConfirm();

  // Clear selection whenever the filter changes — selection only applies to pending.
  useEffect(() => {
    setSelected(new Set());
  }, [filter]);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) navigate("/app");
  }, [authLoading, roleLoading, isAdmin, user, navigate]);

  const { data: posts, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-posts", filter, sort],
    queryFn: async () => {
      let q = supabase
        .from("stories")
        .select(
          "id, content, subject_name, created_at, status, user_id, submitted_anonymously, rejection_reason, rejected_at, is_seed, image_url, location, overall_vibe_rating, profiles ( anonymous_username )"
        )
        .eq("is_seed", false)
        .order("created_at", { ascending: sort === "oldest" })
        // Keep the queue snappy as volume grows; oldest/newest sort still
        // surfaces whichever end matters.
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as PendingPost[];
    },
  });

  // Moderation runs through the `moderate-post` edge function, not a direct
  // table update: the status change and the author's email happen in the same
  // server-side request, so closing this tab can't drop the notification.
  const invalidateQueues = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
    // The author's own view of their submissions.
    queryClient.invalidateQueries({ queryKey: ["stories"] });
  };

  const approve = useMutation({
    mutationFn: (id: string) => moderatePosts("approve", [id]),
    onSuccess: (result) => {
      toast.success(describeModeration("approve", result));
      invalidateQueues();
    },
    onError: (e: any) => toast.error(e?.message || "Approval failed"),
  });

  const bulkApprove = useMutation({
    mutationFn: (ids: string[]) => moderatePosts("approve", ids),
    onSuccess: (result) => {
      toast.success(describeModeration("approve", result));
      setSelected(new Set());
      invalidateQueues();
    },
    onError: (e: any) => toast.error(e?.message || "Bulk approval failed"),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reasonLabel }: { id: string; reasonLabel: string }) => {
      const result = await moderatePosts("reject", [id], reasonLabel);
      // Push is additive on top of the email the function already sent, and
      // best-effort: a rejection must not fail because push did.
      sendPostRejectedNotification(id).catch((e) =>
        console.error("Failed to send rejection push:", e)
      );
      return result;
    },
    onSuccess: (result) => {
      toast.success(describeModeration("reject", result));
      invalidateQueues();
    },
    onError: (e: any) => toast.error(e?.message || "Rejection failed"),
  });

  const bulkReject = useMutation({
    mutationFn: async ({ ids, reasonLabel }: { ids: string[]; reasonLabel: string }) => {
      const result = await moderatePosts("reject", ids, reasonLabel);
      ids.forEach((id) =>
        sendPostRejectedNotification(id).catch((e) =>
          console.error("Failed to send rejection push:", e)
        )
      );
      return result;
    },
    onSuccess: (result) => {
      toast.success(describeModeration("reject", result));
      setSelected(new Set());
      invalidateQueues();
    },
    onError: (e: any) => toast.error(e?.message || "Bulk rejection failed"),
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-counts"] });
    },
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });

  const emailPhotoless = useMutation({
    mutationFn: async () => {
      const { data: rows, error: qErr } = await supabase
        .from("stories")
        .select("user_id")
        .eq("is_seed", false)
        .is("image_url", null)
        .not("user_id", "is", null);
      if (qErr) throw qErr;
      const userIds = Array.from(
        new Set((rows ?? []).map((r: any) => r.user_id).filter(Boolean))
      );
      if (userIds.length === 0) throw new Error("No users to email");
      if (
        !(await confirm({
          title: `Email ${userIds.length} user${userIds.length === 1 ? "" : "s"}?`,
          description: `Send a repost-with-photo email to ${userIds.length} user${
            userIds.length === 1 ? "" : "s"
          }. Copy is generated by AI.`,
          confirmLabel: "Send",
        }))
      ) {
        throw new Error("__cancelled");
      }
      const { data, error } = await supabase.functions.invoke(
        "send-repost-request-email",
        { body: { userIds } }
      );
      if (error) throw error;
      return data as { results: Array<{ userId: string; status: string; error?: string }> };
    },
    onSuccess: (data) => {
      const sent = data.results.filter((r) => r.status === "sent").length;
      const failed = data.results.length - sent;
      toast.success(
        `Emailed ${sent} user${sent === 1 ? "" : "s"}${failed ? `, ${failed} failed` : ""}`
      );
    },
    onError: (e: any) => {
      if (e?.message === "__cancelled") return;
      toast.error(e?.message || "Email send failed");
    },
  });

  if (authLoading || isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  if (!user || !isAdmin) return null;

  const showBulk = filter === "pending";
  const pendingIds = (posts ?? []).filter((p) => p.status === "pending").map((p) => p.id);
  const allSelected =
    showBulk && pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(pendingIds));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const badge = (s: string) => {
    if (s === "pending")
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    if (s === "approved")
      return (
        <Badge variant="outline" className="text-success border-success">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-destructive border-destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  };

  return (
    <div className="bg-gradient-soft p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <AdminPageHeader
          title="Post Moderation"
          subtitle="Approve or reject pending stories — both from accounts and anonymous submissions."
        >
          <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(v: any) => setSort(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
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
        </AdminPageHeader>

        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={emailPhotoless.isPending}
            onClick={() => emailPhotoless.mutate()}
          >
            <Mail className="w-4 h-4 mr-1" />
            {emailPhotoless.isPending ? "Sending…" : "Email posters without photos"}
          </Button>
        </div>

        {showBulk && pendingIds.length > 0 && (
          <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-background/95 backdrop-blur border-b border-border flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span>Select all ({pendingIds.length})</span>
            </label>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {selected.size} selected
            </span>
            <Button
              size="sm"
              disabled={selected.size === 0 || bulkApprove.isPending}
              onClick={() => bulkApprove.mutate(Array.from(selected))}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve selected
            </Button>
            <Select value={bulkReasonId} onValueChange={setBulkReasonId}>
              <SelectTrigger className="w-56 h-9">
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
              disabled={selected.size === 0 || bulkReject.isPending}
              onClick={() =>
                bulkReject.mutate({
                  ids: Array.from(selected),
                  reasonLabel: REJECTION_REASONS.find((r) => r.id === bulkReasonId)!.label,
                })
              }
            >
              <XCircle className="w-4 h-4 mr-1" />
              Reject selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={selected.size === 0}
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
          </div>
        )}

        {isError ? (
          <QueryError
            title="Couldn't load posts"
            message="The post queue failed to load. Try again."
            onRetry={refetch}
          />
        ) : (
        <div className="space-y-4">
          {(posts ?? []).map((p) => (
            <PostRow
              key={p.id}
              post={p}
              badge={badge}
              selectable={showBulk && p.status === "pending"}
              selected={selected.has(p.id)}
              onToggle={() => toggleOne(p.id)}
              onApprove={() => approve.mutate(p.id)}
              onReject={(reasonLabel) => reject.mutate({ id: p.id, reasonLabel })}
              onDelete={async () => {
                if (
                  await confirm({
                    title: "Delete this post?",
                    description: "This permanently deletes the post and cannot be undone.",
                    destructive: true,
                    confirmLabel: "Delete",
                  })
                ) {
                  deletePost.mutate(p.id);
                }
              }}
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
        )}
        {confirmDialog}
      </div>
    </div>
  );
};

const PostRow = ({
  post,
  badge,
  selectable,
  selected,
  onToggle,
  onApprove,
  onReject,
  onDelete,
}: {
  post: PendingPost;
  badge: (s: string) => JSX.Element;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: (reasonLabel: string) => void;
  onDelete: () => void;
}) => {
  const [reasonId, setReasonId] = useState(REJECTION_REASONS[0].id);
  // Private bucket — resolve stored paths to short-lived signed URLs, same as the feed.
  const { data: imageUrls = [], isLoading: imagesLoading } = useStoryImageUrls(
    post.image_url ?? undefined
  );
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2 flex-wrap">
            {selectable && (
              <Checkbox
                checked={selected}
                onCheckedChange={onToggle}
                aria-label="Select post for bulk approval"
              />
            )}
            {post.submitted_anonymously ? (
              <UserX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
            {post.subject_name || "(no subject)"}
            {post.overall_vibe_rating != null && post.overall_vibe_rating !== 0 && (
              <span
                className={
                  post.overall_vibe_rating > 0
                    ? "text-xs font-semibold text-success"
                    : "text-xs font-semibold text-destructive"
                }
              >
                {post.overall_vibe_rating > 0 ? "Juice" : "Milk"}
              </span>
            )}
            <span className="text-xs font-normal text-muted-foreground">
              by {post.submitted_anonymously
                ? "anonymous submission"
                : `@${post.profiles?.anonymous_username ?? "unknown"}`}
              {post.location ? ` · ${post.location}` : ""} ·{" "}
              {new Date(post.created_at).toLocaleString()}
            </span>
          </CardTitle>
          {badge(post.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Photos — reviewed BEFORE approve/reject. Click to open full size. */}
        {post.image_url && (
          imagesLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-28 w-28 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : imageUrls.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {imageUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => window.open(url, "_blank")}
                  className="h-28 w-28 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                  aria-label={`Open photo ${i + 1} full size`}
                >
                  <img src={url} alt={`Post photo ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-destructive">
              Photos failed to load — check the storage bucket before approving.
            </p>
          )
        )}
        {!post.image_url && (
          <p className="text-xs text-muted-foreground">No photos attached.</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.rejection_reason && (
          <p className="text-xs text-destructive">
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
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
        {post.status !== "pending" && (
          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete permanently
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPosts;