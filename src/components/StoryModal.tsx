import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/StoryCard";
import type { Story } from "@/hooks/useStories";

interface StoryModalProps {
  story: (Story & {
    profiles?: {
      id: string;
      anonymous_username: string;
    };
    cities?: {
      city_name: string;
      state_province: string;
      latitude?: number;
      longitude?: number;
    };
    distance?: number;
  }) | null;
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const StoryModal = ({ story, isOpen, onClose, userId }: StoryModalProps) => {
  if (!story) return null;

  const authorName = story.profiles?.anonymous_username || 'Anonymous';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 bg-transparent border-0 shadow-none">
        <div className="relative bg-background rounded-2xl overflow-hidden">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 h-8 w-8 p-0 bg-black/20 hover:bg-black/40 text-white rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Story content */}
          <div className="max-h-[90vh] overflow-y-auto">
            <StoryCard
              story={story}
              authorName={authorName}
              user_id={userId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};