import { X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
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
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!story || !isOpen) return null;

  const authorName = story.profiles?.anonymous_username || 'Anonymous';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setDragY(delta);
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  const opacity = Math.max(0.4, 1 - dragY / 300);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      style={{ opacity }}
      onClick={onClose}
    >
      <div
        className="absolute inset-x-0 bottom-0 top-0 bg-background overflow-y-auto animate-slide-up"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 0.25s ease' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle + close */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 pt-3 pb-2 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex-1" />
          <div className="w-10 h-1 rounded-full bg-border" />
          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <StoryCard
          story={story}
          authorName={authorName}
          user_id={userId}
        />
      </div>
    </div>
  );
};
