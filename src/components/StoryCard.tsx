import { Heart, MessageCircle, Flag, ThumbsUp, ThumbsDown, Trash2, MapPin, MoreVertical, Send, Bookmark, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
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
  subjectName?: string;
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVerifiedUser, setIsVerifiedUser] = useState<boolean | null>(null);

  // Show a one-time double-tap hint on the very first card
  const [showDoubleTapHint] = useState(() => {
    if (localStorage.getItem('juice_dtap_seen')) return false;
    localStorage.setItem('juice_dtap_seen', '1');
    return true;
  });
  const [hintVisible, setHintVisible] = useState(showDoubleTapHint);

  const lastTapRef = useRef<number>(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteStory = useDeleteStory();
  const toggleReaction = useToggleReaction();
  const { data: reactionCounts } = useReactionCounts(story.id);

  useEffect(() => {
    if (!showDoubleTapHint) return;
    const timer = window.setTimeout(() => setHintVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [showDoubleTapHint]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi]);

  useEffect(() => {
    const checkUserReactions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [reactionsRes, verificationRes] = await Promise.all([
          supabase
            .from('reactions')
            .select('reaction_type')
            .eq('story_id', story.id)
            .eq('user_id', user.id),
          supabase
            .from('user_verifications')
            .select('verification_status')
            .eq('user_id', user.id)
            .single(),
        ]);

        if (reactionsRes.data) {
          const reactionTypes = reactionsRes.data.map(r => r.reaction_type);
          setIsRedFlagged(reactionTypes.includes('red_flag'));
          setIsGreenFlagged(reactionTypes.includes('green_flag'));
        }

        setIsVerifiedUser(
          verificationRes.data?.verification_status === 'approved'
        );
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

      if (isVerifiedUser === false) {
        toast({
          title: "Verification required",
          description: "You need to be verified to vote on stories. Complete your verification to unlock this.",
          variant: "destructive"
        });
        return;
      }

      if (isVerifiedUser === null) {
        const { data: verification } = await supabase
          .from('user_verifications')
          .select('verification_status')
          .eq('user_id', user.id)
          .single();

        if (!verification || verification.verification_status !== 'approved') {
          setIsVerifiedUser(false);
          toast({
            title: "Verification required",
            description: "You need to be verified to vote on stories. Please complete your verification process.",
            variant: "destructive"
          });
          return;
        }
        setIsVerifiedUser(true);
      }

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
        if (reactionType === 'red_flag') {
          setIsRedFlagged(true);
          if (result.replacedType === 'green_flag') setIsGreenFlagged(false);
        } else if (reactionType === 'green_flag') {
          setIsGreenFlagged(true);
          if (result.replacedType === 'red_flag') setIsRedFlagged(false);
        }
      } else if (result?.action === 'removed') {
        if (reactionType === 'red_flag') setIsRedFlagged(false);
        else if (reactionType === 'green_flag') setIsGreenFlagged(false);
      }
    } catch (error) {
      console.error('Reaction error:', error);
      toast({
        title: "Error",
        description: "Failed to toggle reaction. Please try again.",
        variant: "destructive"
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

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.origin + '/app';
    const text = `${story.subject_name || 'Story'} on The Juice: ${story.content.substring(0, 80)}${story.content.length > 80 ? '…' : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'The Juice', text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied!", description: "App link copied to clipboard." });
      }
    } catch {
      // user cancelled share sheet
    }
  };

  const handleTagClick = (tag: string) => {
    navigate(`/explore?tag=${encodeURIComponent(tag)}`);
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
            <ThumbsUp
              className="h-24 w-24 text-juice-green drop-shadow-lg"
              fill="currentColor"
              style={{ animation: "heart-burst 700ms ease-out forwards" }}
            />
          </div>
        )}

        {/* Header — subject (about) + author (posted by) */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
              {(story.subject_name || subjectName || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-[10px] text-muted-foreground font-normal uppercase tracking-wide">about</span>
                <p className="text-sm font-semibold text-foreground truncate">
                  {story.subject_name || subjectName || 'Anonymous'}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleAuthorClick(); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate"
              >
                by @{authorName} · {formatDate(story.created_at)}
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

        {/* Media carousel — swipe to navigate, dots track position */}
        {imageUrls.length > 0 && (
          <div className="relative bg-muted">
            <Carousel setApi={setCarouselApi} className="w-full" opts={{ loop: false }}>
              <CarouselContent>
                {imageUrls.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="bg-muted aspect-square flex items-center justify-center overflow-hidden">
                      <img
                        src={url}
                        alt={`Story image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {imageUrls.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {imageUrls.map((_, index) => (
                  <div
                    key={index}
                    className={`rounded-full transition-all duration-200 ${
                      index === currentSlide
                        ? 'w-3 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Double-tap hint — first visit only */}
        {hintVisible && (
          <div className="px-4 pt-2 pb-0 flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-in">
            <ThumbsUp className="h-3 w-3 text-juice-green" />
            <span>Double-tap anywhere to green flag</span>
          </div>
        )}

        {/* Action row */}
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); handleReaction('red_flag'); }}
              aria-label="Red flag — bad experience"
              className="p-2 -ml-1 rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <ThumbsDown
                className={`h-6 w-6 transition-colors ${isRedFlagged ? 'text-red-500' : 'text-foreground'}`}
                strokeWidth={isRedFlagged ? 2.4 : 1.8}
                fill={isRedFlagged ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleReaction('green_flag'); }}
              aria-label="Green flag — good experience"
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <ThumbsUp
                className={`h-6 w-6 transition-colors ${isGreenFlagged ? 'text-juice-green' : 'text-foreground'}`}
                strokeWidth={isGreenFlagged ? 2.4 : 1.8}
                fill={isGreenFlagged ? 'currentColor' : 'none'}
              />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleComment(); }}
              aria-label="Comment"
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
            >
              <MessageCircle className="h-6 w-6 text-foreground" strokeWidth={1.8} />
            </button>
            <button
              aria-label="Share"
              className="p-2 rounded-full hover:bg-muted active:scale-95 transition-all"
              onClick={handleShare}
            >
              <Send className="h-6 w-6 text-foreground" strokeWidth={1.8} />
            </button>
          </div>
          <button
            aria-label="Save"
            className="p-2 -mr-1 rounded-full hover:bg-muted active:scale-95 transition-all"
          >
            <Bookmark className="h-6 w-6 text-foreground" strokeWidth={1.8} />
          </button>
        </div>

        {/* Verification nudge — shown only to unverified users */}
        {isVerifiedUser === false && (
          <div className="px-4 pb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldAlert className="h-3 w-3 text-primary flex-shrink-0" />
            <span>
              <button
                onClick={() => navigate('/')}
                className="text-primary font-medium hover:underline"
              >
                Verify your account
              </button>
              {' '}to vote on stories
            </span>
          </div>
        )}

        {/* Counts */}
        <div className="px-4 text-sm font-semibold text-foreground">
          {(reactionCounts?.red_flag || 0) + (reactionCounts?.green_flag || 0)} votes
          {((reactionCounts?.green_flag || 0) > 0 || (reactionCounts?.red_flag || 0) > 0) && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              <span className="text-juice-green">👍 {reactionCounts?.green_flag || 0}</span>
              {' · '}
              <span className="text-red-500">👎 {reactionCounts?.red_flag || 0}</span>
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

        {/* Tags — tappable, navigate to explore */}
        {story.story_tags && story.story_tags.length > 0 && (
          <div className="px-4 pt-0.5 text-sm leading-tight">
            {story.story_tags.map((t, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); handleTagClick(t.tag); }}
                className="ig-tag mr-1.5 hover:underline"
              >
                #{t.tag.replace(/\s+/g, '')}
              </button>
            ))}
          </div>
        )}

        {/* Comments link */}
        {story.comments_count > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); handleComment(); }}
            className="block px-4 pt-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all {story.comments_count} comments
          </button>
        )}

        {/* Location + time */}
        {(story.location || story.cities) && (
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
        )}
        {!(story.location || story.cities) && (
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
