import { Heart, MessageCircle, Flag, Trash2, MapPin, MoreVertical, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentsModal from "./CommentsModal";
import { BlockUserDialog } from "./BlockUserDialog";
import { ReportContentDialog } from "./ReportContentDialog";
import { FlagRatingDisplay } from "./FlagRating";
import { useDeleteStory } from "@/hooks/useStories";
import { useToggleReaction } from "@/hooks/useReactions";
import { useReactionCounts } from "@/hooks/useReactionCounts";
import { useAuth } from "@/hooks/useAuth";
import { useVerification } from "@/hooks/useVerification";
import { useUserReactions, useSetUserReactions } from "@/hooks/useUserReactions";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatDistance } from "@/lib/distance";
import type { Story } from "@/hooks/useStories";

const tagEmojis: { [key: string]: string } = {
  'red flag': '🚩',
  'ghosted': '🫠',
  'loyal': '💯',
  'golddigger': '💰',
  'clingy': '🤗',
  'toxic': '☠️',
  'sweet': '🍭',
  'funny': '😂',
  'boring': '😴',
  'crazy': '🤪',
};

interface StoryCardProps {
  story: Story & {
    distance?: number;
    cities?: { city_name: string; state_province: string };
  };
  authorName: string;
  subjectName?: string;
  /** Pass the logged-in user's id so delete/block controls work without an extra auth call. */
  user_id?: string;
  onDelete?: () => void;
}

const StoryCard = ({
  story,
  authorName,
  subjectName,
  user_id,
  onDelete,
}: StoryCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef<number>(0);

  const { user } = useAuth();
  const { isVerified } = useVerification(user?.id);
  const { isRedFlagged, isGreenFlagged } = useUserReactions(story.id, user?.id);
  const setUserReactions = useSetUserReactions(story.id, user?.id);

  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteStory = useDeleteStory();
  const toggleReaction = useToggleReaction();
  const { data: reactionCounts } = useReactionCounts(story.id);

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to react to stories.",
        variant: "destructive",
      });
      return;
    }

    if (!isVerified) {
      toast({
        title: "Verification required",
        description: "You need to be verified to vote on stories. Please complete your verification process.",
        variant: "destructive",
      });
      return;
    }

    // Optimistic update — responds instantly before the mutation settles.
    if (reactionType === 'green_flag') {
      setUserReactions({ isGreenFlagged: !isGreenFlagged, ...(isRedFlagged && !isGreenFlagged ? { isRedFlagged: false } : {}) });
    } else if (reactionType === 'red_flag') {
      setUserReactions({ isRedFlagged: !isRedFlagged, ...(isGreenFlagged && !isRedFlagged ? { isGreenFlagged: false } : {}) });
    }

    try {
      const result = await toggleReaction.mutateAsync({ storyId: story.id, reactionType });

      // Reconcile with actual server result.
      if (result?.action === 'added') {
        setUserReactions({
          isRedFlagged: reactionType === 'red_flag',
          isGreenFlagged: reactionType === 'green_flag',
        });
      } else if (result?.action === 'removed') {
        setUserReactions({
          ...(reactionType === 'red_flag' ? { isRedFlagged: false } : {}),
          ...(reactionType === 'green_flag' ? { isGreenFlagged: false } : {}),
        });
      }
    } catch {
      // Roll back optimistic update on failure.
      setUserReactions({ isRedFlagged, isGreenFlagged });
      toast({
        title: "Error",
        description: "Failed to toggle reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="button"], input, textarea')) return;
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      lastTapRef.current = 0;
      triggerDoubleTap();
    } else {
      lastTapRef.current = now;
    }
  };

  const triggerDoubleTap = () => {
    setShowHeartBurst(true);
    window.setTimeout(() => setShowHeartBurst(false), 700);
    if (!isGreenFlagged) handleReaction('green_flag');
  };

  const handleComment = () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to comment on stories.",
        variant: "destructive",
      });
      return;
    }
    setShowComments(true);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await deleteStory.mutateAsync(story.id);
      toast({ title: "Story deleted", description: "Your story has been deleted successfully." });
      onDelete?.();
    } catch {
      toast({ title: "Error", description: "Failed to delete story. Please try again.", variant: "destructive" });
    }
  };

  const handleAuthorClick = () => {
    if (story.profile_id) navigate(`/author/${story.profile_id}`);
  };

  const canDelete = user_id === story.user_id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getImageUrls = (): string[] => {
    if (!story.image_url) return [];
    try {
      const parsed = JSON.parse(story.image_url);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const imageUrls = getImageUrls();

  return (
    <>
      <div
        className="relative bg-background border-b border-border mb-2 select-none"
        onClick={handleCardClick}
      >
        {showHeartBurst && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <Heart
              className="h-24 w-24 text-primary drop-shadow-lg"
              fill="currentColor"
              style={{ animation: "heart-burst 700ms ease-out forwards" }}
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
              {(story.subject_name || subjectName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-foreground truncate">
                {story.subject_name || subjectName || 'Anonymous'}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleAuthorClick(); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                @{authorName} · {formatDate(story.created_at)}
              </button>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-foreground hover:bg-muted">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canDelete && (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Story
                </DropdownMenuItem>
              )}
              {!canDelete && story.user_id && (
                <>
                  <BlockUserDialog userId={story.user_id} username={authorName}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Block @{authorName}
                    </DropdownMenuItem>
                  </BlockUserDialog>
                  <ReportContentDialog targetType="story" targetId={story.id}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report Story
                    </DropdownMenuItem>
                  </ReportContentDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Media */}
        {imageUrls.length > 0 && (
          <div className="relative bg-muted">
            <Carousel className="w-full">
              <CarouselContent>
                {imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="bg-muted aspect-square flex items-center justify-center overflow-hidden">
                      <img
                        src={url}
                        alt={`Story image ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        loading="lazy"
                        onClick={() => window.open(url, '_blank')}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {imageUrls.length > 1 && (
                <>
                  <CarouselPrevious className="left-2" />
                  <CarouselNext className="right-2" />
                </>
              )}
            </Carousel>
            {imageUrls.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {imageUrls.map((_, index) => (
                  <div key={index} className="w-1.5 h-1.5 rounded-full bg-background/80 ring-1 ring-foreground/20" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleReaction('red_flag')}
              aria-label="Red flag"
              className="p-2 -ml-1 rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <Flag
                className="h-6 w-6"
                style={{ color: '#E24B4A', opacity: isRedFlagged ? 1 : 0.45 }}
                strokeWidth={isRedFlagged ? 2.4 : 1.8}
                fill={isRedFlagged ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={() => handleReaction('green_flag')}
              aria-label="Green flag"
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <Flag
                className="h-6 w-6"
                style={{ color: '#639922', opacity: isGreenFlagged ? 1 : 0.45 }}
                strokeWidth={isGreenFlagged ? 2.4 : 1.8}
                fill={isGreenFlagged ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={handleComment}
              aria-label="Comment"
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={1.8} />
            </button>
          </div>
          <button
            aria-label="Save (coming soon)"
            onClick={() => toast({ title: "Coming soon", description: "Saved stories will be in your profile." })}
            className="p-2 -mr-1 rounded-full hover:bg-muted active:scale-95 transition-all opacity-40"
          >
            <Bookmark className="h-6 w-6 text-foreground" strokeWidth={1.8} />
          </button>
        </div>

        {/* Counts */}
        <div className="px-4 text-sm font-semibold text-foreground">
          {(reactionCounts?.red_flag || 0) + (reactionCounts?.green_flag || 0)} flags
          {(reactionCounts?.green_flag || 0) > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {reactionCounts?.green_flag} green · {reactionCounts?.red_flag || 0} red
            </span>
          )}
        </div>

        {/* Caption */}
        <div className="px-4 pt-1 pb-1 text-sm leading-snug text-foreground">
          <span className="font-semibold mr-1.5">
            {story.subject_name || subjectName || 'anonymous'}
          </span>
          <span className="whitespace-pre-wrap">{story.content}</span>
        </div>

        {/* Flag ratings */}
        <FlagRatingDisplay
          ratings={{
            communication: story.communication_rating || 0,
            loyalty: story.loyalty_rating || 0,
            vibe: story.overall_vibe_rating || 0,
            respect: story.emotional_safety_rating || 0,
          }}
        />

        {/* Tags */}
        {story.story_tags && story.story_tags.length > 0 && (
          <div className="px-4 pt-0.5 text-sm leading-tight">
            {story.story_tags.map((t, i) => (
              <span key={i} className="ig-tag mr-1.5">
                #{t.tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>
        )}

        {/* Comments link */}
        {story.comments_count > 0 && (
          <button
            onClick={handleComment}
            className="block px-4 pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {story.comments_count} comments
          </button>
        )}

        {/* Location / timestamp footer */}
        {(story.location || story.cities) ? (
          <div className="px-4 pt-1 pb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>
              {story.cities
                ? `${story.cities.city_name}${story.cities.state_province ? ', ' + story.cities.state_province : ''}`
                : story.location}
              {story.distance && (
                <span className="ml-1 text-primary">· {formatDistance(story.distance)} away</span>
              )}
            </span>
          </div>
        ) : (
          <div className="px-4 pt-0.5 pb-3 text-[11px] uppercase tracking-wide text-muted-foreground">
            {formatDate(story.created_at)}
          </div>
        )}
      </div>

      {showComments && (
        <CommentsModal
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          storyId={story.id}
          storyPreview={story.content.substring(0, 100) + (story.content.length > 100 ? '...' : '')}
        />
      )}
    </>
  );
};

export default StoryCard;
