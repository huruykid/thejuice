import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomSheet from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Send } from "lucide-react";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: string;
  storyPreview: string;
}

/**
 * Comments as a bottom sheet (IG pattern). The composer lives in the sheet's
 * pinned footer so the iOS keyboard pushes it up instead of covering it —
 * the old centered dialog hid the input behind the keyboard.
 */
const CommentsModal = ({ isOpen, onClose, storyId, storyPreview }: CommentsModalProps) => {
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: comments = [], isLoading } = useComments(storyId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await createComment.mutateAsync({ storyId, content: newComment.trim() });
      setNewComment("");
      toast({ title: "Comment added", description: "Your comment has been posted." });
    } catch {
      toast({ title: "Error", description: "Failed to post comment.", variant: "destructive" });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId, storyId });
      toast({ title: "Comment deleted", description: "Your comment has been removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
    }
  };

  const handleUsernameClick = (profileId: string) => {
    onClose();
    // Defer navigation one tick so the sheet's close animation can begin before
    // the route transition — avoids racing the unmount.
    setTimeout(() => navigate(`/author/${profileId}`), 0);
  };

  return (
    <BottomSheet
      open={isOpen}
      onClose={onClose}
      title="Comments"
      description={storyPreview}
      height="tall"
      footer={
        <form onSubmit={handleSubmitComment} className="flex items-end gap-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={1}
            className="min-h-[44px] max-h-28 flex-1 resize-none"
            disabled={createComment.isPending}
          />
          <Button
            type="submit"
            size="icon"
            aria-label="Post comment"
            disabled={!newComment.trim() || createComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      }
    >
      <div className="px-4">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
          </div>
        ) : (
          <div>
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-border py-3 last:border-0">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {comment.profiles ? (
                      <button
                        onClick={() => handleUsernameClick(comment.profiles!.id)}
                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        @{comment.profiles.anonymous_username}
                      </button>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">@anonymous</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {currentUserId && comment.user_id === currentUserId && (
                    <button
                      aria-label="Delete comment"
                      className="flex h-11 w-11 items-center justify-center rounded-full text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteComment.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default CommentsModal;
