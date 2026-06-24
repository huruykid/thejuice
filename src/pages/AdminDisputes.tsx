import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useDisputes, useResolveDispute, type DisputeRequest } from "@/hooks/useDisputes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<DisputeRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-muted text-muted-foreground",
};

const AdminDisputes = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole(user?.id);
  const { data: disputes = [], isLoading } = useDisputes();
  const resolveDispute = useResolveDispute();

  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    disputeId: string;
    storyId: string | null;
  }>({ open: false, disputeId: "", storyId: null });
  const [approveConfirm, setApproveConfirm] = useState<DisputeRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const pendingCount = useMemo(
    () => disputes.filter((d) => d.status === "pending").length,
    [disputes],
  );

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

  const handleApprove = (dispute: DisputeRequest) => {
    setApproveConfirm(dispute);
  };

  const confirmApprove = () => {
    if (!approveConfirm) return;
    const dispute = approveConfirm;
    setApproveConfirm(null);
    resolveDispute.mutate(
      { id: dispute.id, story_id: dispute.story_id, status: "approved" },
      {
        onSuccess: () => toast.success("Dispute approved — story removed"),
        onError: () => toast.error("Failed to resolve dispute"),
      },
    );
  };

  const openRejectDialog = (dispute: DisputeRequest) => {
    setAdminNotes("");
    setRejectDialog({ open: true, disputeId: dispute.id, storyId: dispute.story_id });
  };

  const handleReject = () => {
    resolveDispute.mutate(
      {
        id: rejectDialog.disputeId,
        story_id: rejectDialog.storyId,
        status: "rejected",
        admin_notes: adminNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Dispute rejected");
          setRejectDialog({ open: false, disputeId: "", storyId: null });
        },
        onError: () => toast.error("Failed to reject dispute"),
      },
    );
  };

  return (
    <div className="bg-gradient-soft p-4 pb-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Flag className="h-6 w-6 text-juice-orange" />
          <h1 className="text-2xl font-bold">
            Disputes
            {pendingCount > 0 && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                ({pendingCount} pending)
              </span>
            )}
          </h1>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading disputes…</div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No dispute requests yet.</div>
        ) : (
          <div className="space-y-3">
            {disputes.map((dispute) => (
              <DisputeRow
                key={dispute.id}
                dispute={dispute}
                onApprove={() => handleApprove(dispute)}
                onReject={() => openRejectDialog(dispute)}
                disabled={resolveDispute.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Approve confirmation */}
      <AlertDialog
        open={!!approveConfirm}
        onOpenChange={(open) => { if (!open) setApproveConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve dispute and remove story?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the linked story and mark{" "}
              <strong>{approveConfirm?.subject_name}</strong>'s dispute as resolved. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmApprove}
            >
              Approve &amp; remove story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={(open) =>
          setRejectDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject dispute request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="admin-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="admin-notes"
              placeholder="Why is this request being rejected? (internal only, not shared with submitter)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, disputeId: "", storyId: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={resolveDispute.isPending}
            >
              {resolveDispute.isPending ? "Rejecting…" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DisputeRow({
  dispute,
  onApprove,
  onReject,
  disabled,
}: {
  dispute: DisputeRequest;
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{dispute.subject_name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[dispute.status]}`}
            >
              {dispute.status}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(dispute.created_at).toLocaleString()}
          </span>
        </div>

        {/* Contact */}
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Contact:</span>{" "}
          {dispute.contact_email}
        </p>

        {/* Reason */}
        <p className="text-sm">
          <span className="font-medium">Reason:</span> {dispute.reason}
        </p>

        {/* Additional info */}
        {dispute.additional_info && (
          <p className="text-sm text-muted-foreground">{dispute.additional_info}</p>
        )}

        {/* Story preview */}
        {dispute.story_id && dispute.story_content ? (
          <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Linked story
              {dispute.story_subject_name
                ? ` — about "${dispute.story_subject_name}"`
                : ""}
            </p>
            <p className="text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
              {dispute.story_content}
            </p>
          </div>
        ) : dispute.story_id ? (
          <p className="text-xs text-muted-foreground italic">
            Story was already deleted.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            No story linked to this request.
          </p>
        )}

        {/* Admin notes (on resolved disputes) */}
        {dispute.admin_notes && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Admin notes:</span> {dispute.admin_notes}
          </p>
        )}

        {/* Actions (pending only) */}
        {dispute.status === "pending" && (
          <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
            <Button
              size="sm"
              variant="destructive"
              onClick={onApprove}
              disabled={disabled}
            >
              Approve &amp; Remove Story
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={disabled}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default AdminDisputes;
