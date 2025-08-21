import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserX } from "lucide-react";
import { useBlockUser } from "@/hooks/useUserBlocks";

interface BlockUserDialogProps {
  userId: string;
  username: string;
  children?: React.ReactNode;
}

export const BlockUserDialog = ({ userId, username, children }: BlockUserDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const blockUser = useBlockUser();

  const handleBlock = async () => {
    await blockUser.mutateAsync({ userId, reason: reason.trim() || undefined });
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="destructive" size="sm">
            <UserX className="h-4 w-4 mr-2" />
            Block User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block @{username}?</DialogTitle>
          <DialogDescription>
            This user will no longer be able to interact with your content, and you won't see their posts.
            You can unblock them later in your privacy settings.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you blocking this user?"
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blockUser.isPending}
            >
              {blockUser.isPending ? "Blocking..." : "Block User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};