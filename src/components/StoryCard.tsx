import { MessageCircle, Flag, Trash2, Shield, MapPin, MoreVertical } from "lucide-react";
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
import { useState, useEffect } from "react";
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
      toast({
        title: "Error",
        description: "Failed to toggle reaction. Please try again.",
        variant: "destructive"
      });
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
      <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden mb-4 transition-colors duration-150 hover:border-border-light">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {(subjectName || 'Anonymous').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">{story.subject_name || subjectName || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{formatDate(story.created_at)}</span>
              
              {/* Story menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
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
          <div className="relative">
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
                    className="w-1.5 h-1.5 rounded-full bg-white/60"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-foreground leading-[1.55] whitespace-pre-wrap">{story.content}</p>
          
          {/* Location - moved here after story content and images */}
          {(story.location || story.cities) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">
                {story.cities 
                  ? `${story.cities.city_name}, ${story.cities.state_province}`
                  : story.location
                }
                {story.distance && (
                  <span className="ml-1 text-primary font-medium">
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
                <Badge key={index} variant="secondary" className="text-xs">
                  {tagEmojis[storyTag.tag.toLowerCase()] || '🏷️'} {storyTag.tag}
                </Badge>
              ))}
            </div>
          )}

        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{story.comments_count}</span>
            </Button>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction('green_flag')}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors duration-150 ${
                  isGreenFlagged 
                    ? 'bg-success/15 border-success/40 text-success' 
                    : 'border-border text-muted-foreground hover:border-success/40 hover:bg-success/10 hover:text-success'
                }`}
              >
                <Flag className="h-4 w-4" />
                <span className="text-sm font-medium">{reactionCounts?.green_flag || 0}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReaction('red_flag')}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors duration-150 ${
                  isRedFlagged 
                    ? 'bg-destructive/15 border-destructive/40 text-destructive' 
                    : 'border-border text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive'
                }`}
              >
                <Flag className="h-4 w-4" />
                <span className="text-sm font-medium">{reactionCounts?.red_flag || 0}</span>
              </Button>
            </div>
          </div>

          {/* Author attribution */}
          <div className="pt-2 mt-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleAuthorClick}
                className="text-xs text-muted-foreground hover:text-primary transition-colors duration-150"
              >
                Posted by: {authorName}
              </button>
              <span className="text-xs text-muted-foreground">
                {formatViewCount(story.view_count || 0)} views
              </span>
            </div>
          </div>

          {/* Trust strip — moderation + report. Always visible. */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-success/80" />
              <span>Moderated · post responsibly</span>
            </div>
            {!canDelete && story.user_id && (
              <ReportContentDialog targetType="story" targetId={story.id}>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-150"
                  aria-label="Report this story"
                >
                  <Flag className="h-3 w-3" />
                  <span>Report</span>
                </button>
              </ReportContentDialog>
            )}
          </div>
        </div>
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
