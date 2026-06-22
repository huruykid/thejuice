import { Heart, MessageCircle, Flag, Star, Trash2, ShieldCheck, MapPin, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useDeleteStory } from "@/hooks/useStories";
import { useToggleReaction } from "@/hooks/useReactions";
import { useReactionCounts } from "@/hooks/useReactionCounts";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { formatDistance } from "@/lib/distance";

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
  'crazy': '🤪'
};

interface StoryCardProps {
  story: {
    id: string;
    content: string;
    location?: string;
    communication_rating: number;
    loyalty_rating: number;
    emotional_safety_rating: number;
    overall_vibe_rating: number;
    reactions_count: number;
    comments_count: number;
    view_count: number;
    created_at: string;
    user_id?: string;
    image_url?: string;
    subject_name?: string;
    profile_id?: string;
    story_tags: Array<{
      tag: string;
    }>;
    distance?: number;
    cities?: {
      city_name: string;
      state_province: string;
    };
  };
  authorName: string;
  subjectName?: string; // The person the story is about
  user_id?: string;
  onDelete?: () => void;
}

const StoryCard = ({ 
  story, 
  authorName, 
  subjectName,
  user_id, 
  onDelete 
}: StoryCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [isRedFlagged, setIsRedFlagged] = useState(false);
  const [isGreenFlagged, setIsGreenFlagged] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastTapRef = useRef<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteStory = useDeleteStory();
  const toggleReaction = useToggleReaction();
  const { data: reactionCounts } = useReactionCounts(story.id);

  // Check if current user has reacted to this story
  useEffect(() => {
    const checkUserReactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for all reaction types
        const { data: reactions } = await supabase
          .from('reactions')
          .select('reaction_type')
          .eq('story_id', story.id)
          .eq('user_id', user.id);

        if (reactions) {
          const reactionTypes = reactions.map(r => r.reaction_type);
          setIsRedFlagged(reactionTypes.includes('red_flag'));
          setIsGreenFlagged(reactionTypes.includes('green_flag'));
        }
      } catch (error) {
        console.error('Error checking user reactions:', error);
      }
    };

    checkUserReactions();
  }, [story.id]);

  const handleReaction = async (reactionType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login required",
          description: "Please log in to react to stories.",
          variant: "destructive"
        });
        return;
      }

      // Check if user is verified before attempting to react
      const { data: verification } = await supabase
        .from('user_verifications')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (!verification || verification.verification_status !== 'approved') {
        toast({
          title: "Verification required",
          description: "You need to be verified to vote on stories. Please complete your verification process.",
          variant: "destructive"
        });
        return;
      }

      // Optimistic local toggle so the button responds instantly.
      const prevRed = isRedFlagged;
      const prevGreen = isGreenFlagged;
      if (reactionType === 'green_flag') {
        setIsGreenFlagged(!prevGreen);
        if (!prevGreen && prevRed) setIsRedFlagged(false);
      } else if (reactionType === 'red_flag') {
        setIsRedFlagged(!prevRed);
        if (!prevRed && prevGreen) setIsGreenFlagged(false);
      }

      const result = await toggleReaction.mutateAsync({ 
        storyId: story.id, 
        reactionType 
      });
      
      if (result?.action === 'added') {
        // User added a new reaction
        if (reactionType === 'red_flag') {
          setIsRedFlagged(true);
          // If they replaced a green flag, remove it
          if (result.replacedType === 'green_flag') {
            setIsGreenFlagged(false);
          }
        } else if (reactionType === 'green_flag') {
          setIsGreenFlagged(true);
          // If they replaced a red flag, remove it
          if (result.replacedType === 'red_flag') {
            setIsRedFlagged(false);
          }
        }
      } else if (result?.action === 'removed') {
        // User removed their reaction
        if (reactionType === 'red_flag') {
          setIsRedFlagged(false);
        } else if (reactionType === 'green_flag') {
          setIsGreenFlagged(false);
        }
      }
    } catch (error) {
      console.error('Reaction error:', error);
      // Roll back optimistic toggle.
      setIsRedFlagged((v) => v);
      setIsGreenFlagged((v) => v);
      toast({
        title: "Error",
        description: "Failed to toggle reaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Detect double-tap on the card body (ignoring buttons / interactive children).
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
    if (!isGreenFlagged) {
      handleReaction('green_flag');
    }
  };

  const handleComment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login required",
          description: "Please log in to comment on stories.",
          variant: "destructive"
        });
        return;
      }
      setShowComments(true);
    } catch (error) {
      console.error('Error checking user auth:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this story?')) {
      try {
        await deleteStory.mutateAsync(story.id);
        toast({
          title: "Story deleted",
          description: "Your story has been deleted successfully.",
        });
        onDelete?.();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete story. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleAuthorClick = () => {
    if (story.profile_id) {
      navigate(`/author/${story.profile_id}`);
    }
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

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  // Parse image URLs from JSON string
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
        className="relative bg-card border-2 border-foreground shadow-brut overflow-hidden mb-8 select-none"
        onClick={handleCardClick}
      >
        {showHeartBurst && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            <Heart
              className="h-24 w-24 text-primary drop-shadow-[4px_4px_0_hsl(var(--foreground))]"
              fill="currentColor"
              style={{ animation: "heart-burst 700ms ease-out forwards" }}
            />
          </div>
        )}
        {/* Header — black bar w/ avatar tile */}
        <div className="p-4 border-b-2 border-foreground bg-foreground text-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent text-foreground border-2 border-background flex items-center justify-center">
                <span className="font-display text-lg leading-none pt-0.5">
                  {(story.subject_name || subjectName || 'A').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="leading-tight">
                <p className="font-display text-xl leading-none pt-1 uppercase">
                  {story.subject_name || subjectName || 'Anonymous'}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAuthorClick(); }}
                  className="text-[10px] uppercase font-bold tracking-widest text-primary hover:text-accent transition-colors"
                >
                  Spilled by @{authorName}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                {formatDate(story.created_at)}
              </span>
              {/* Story menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-background hover:bg-background/10 hover:text-background"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive hover:text-destructive"
                    >
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
          </div>
        </div>

        {/* Image Carousel */}
        {imageUrls.length > 0 && (
          <div className="relative border-b-2 border-foreground">
            <Carousel className="w-full">
              <CarouselContent>
                {imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="bg-muted">
                      <img
                        src={url}
                        alt={`Story image ${index + 1}`}
                        className="w-full h-auto object-contain cursor-pointer"
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
                  <div
                    key={index}
                    className="w-2 h-2 bg-background border border-foreground"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-foreground text-lg leading-snug font-medium whitespace-pre-wrap">
            {story.content}
          </p>
          
          {/* Location - moved here after story content and images */}
          {(story.location || story.cities) && (
            <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>
                {story.cities 
                  ? `${story.cities.city_name}, ${story.cities.state_province}`
                  : story.location
                }
                {story.distance && (
                  <span className="ml-1 text-primary">
                    • {formatDistance(story.distance)} away
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Tags */}
          {story.story_tags && story.story_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {story.story_tags.map((storyTag, index) => (
                <span key={index} className="brut-tag">
                  {tagEmojis[storyTag.tag.toLowerCase()] || '🏷️'} {storyTag.tag}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* Vote bar — two big Bebas buttons, equal weight */}
        <div className="grid grid-cols-2 border-t-4 border-foreground">
          <button
            onClick={() => handleReaction('green_flag')}
            className={`py-4 flex flex-col items-center justify-center border-r-2 border-foreground transition-colors active:translate-y-[1px] ${
              isGreenFlagged
                ? 'bg-success text-success-foreground'
                : 'bg-background hover:bg-success/15 text-foreground'
            }`}
          >
            <span className="font-display text-2xl leading-none pt-1">
              {reactionCounts?.green_flag || 0}
            </span>
            <span className="font-black text-[11px] uppercase tracking-tighter mt-1">
              Green Flag
            </span>
          </button>
          <button
            onClick={() => handleReaction('red_flag')}
            className={`py-4 flex flex-col items-center justify-center transition-colors active:translate-y-[1px] ${
              isRedFlagged
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-primary/15 text-foreground'
            }`}
          >
            <span className="font-display text-2xl leading-none pt-1">
              {reactionCounts?.red_flag || 0}
            </span>
            <span className="font-black text-[11px] uppercase tracking-tighter mt-1">
              Red Flag
            </span>
          </button>
        </div>

        {/* Footer strip — comments + views */}
        <button
          onClick={handleComment}
          className="w-full px-4 py-2 border-t-2 border-foreground flex justify-between items-center text-[11px] font-black uppercase tracking-wider hover:bg-accent transition-colors"
        >
          <span className="flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
            {story.comments_count} Comments
          </span>
          <span className="text-primary">Spill the tea →</span>
        </button>
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
