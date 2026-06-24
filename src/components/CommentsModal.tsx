import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    // Defer navigation one tick so the Dialog close animation can begin before
    // the route transition — avoids racing the modal unmount.
    setTimeout(() => navigate(`/author/${profileId}`), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <div className="text-sm text-muted-foreground line-clamp-2">
            {storyPreview}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="py-2 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {comment.profiles ? (
                        <button
                          onClick={() => handleUsernameClick(comment.profiles!.id)}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deleteComment.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmitComment} className="flex gap-2 mt-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[60px] resize-none"
            disabled={createComment.isPending}
          />
          <Button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsModal;
