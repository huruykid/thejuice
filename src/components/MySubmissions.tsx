import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMySubmissions } from "@/hooks/useStories";
import {
  visibleSubmissions,
  submissionStatusLabel,
  submissionStatusHint,
  type SubmissionsVariant,
  type SubmissionStatus,
} from "@/lib/submissions";

interface MySubmissionsProps {
  userId?: string;
  /** See SubmissionsVariant — `full` on UnverifiedHome, `pinned` above the feed. */
  variant?: SubmissionsVariant;
  className?: string;
}

const STATUS_ICON: Record<SubmissionStatus, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

/**
 * The author's own posts, with review status — the only place a story is
 * visible to the person who wrote it before a moderator approves it.
 */
const MySubmissions = ({ userId, variant = "full", className }: MySubmissionsProps) => {
  const { data: submissions = [] } = useMySubmissions(userId);
  const visible = visibleSubmissions(submissions, variant);

  // The pinned strip is additive to a feed that already has content of its own —
  // an empty "Your submissions" heading above it is just noise.
  if (variant === "pinned" && visible.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-foreground mb-2 px-1">Your submissions</h3>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">You haven't posted anything yet.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((s) => {
            const Icon = STATUS_ICON[s.status];
            const hint = submissionStatusHint(s.status, s.rejection_reason);
            return (
              <Card key={s.id} className="p-3 bg-card border-border">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-foreground line-clamp-2 flex-1">{s.content}</p>
                  <Badge
                    variant={
                      s.status === "rejected"
                        ? "destructive"
                        : s.status === "approved"
                          ? "default"
                          : "secondary"
                    }
                    className="shrink-0"
                  >
                    <Icon className="h-3 w-3 mr-1" /> {submissionStatusLabel(s.status)}
                  </Badge>
                </div>
                {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MySubmissions;
