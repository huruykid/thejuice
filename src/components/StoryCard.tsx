import { Heart, MessageCircle, Flag, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import CommentsModal from "./CommentsModal";
import { useDeleteStory } from "@/hooks/useStories";
import { useToggleReaction } from "@/hooks/useReactions";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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
    created_at: string;
    user_id?: string;
    image_url?: string;
    subject_name?: string;
    profile_id?: string;
    story_tags: Array<{
      tag: string;
    }>;
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
  const [isLiked, setIsLiked] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(story.reactions_count);
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteStory = useDeleteStory();
  const toggleReaction = useToggleReaction();

  // Check if current user has liked this story
  useEffect(() => {
    const checkUserReaction = async () => {
      try {
        const { data: { user } } = await (supabase as any).auth.getUser();
        if (!user) return;

        // Check if user has liked this story
        const { data: reaction } = await (supabase as any)
          .from('reactions')
          .select('id')
          .eq('story_id', story.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like')
          .maybeSingle();

        setIsLiked(!!reaction);
      } catch (error) {
        console.error('Error checking user reaction:', error);
      }
    };

    checkUserReaction();
  }, [story.id]);

  const handleLike = async () => {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) {
        toast({
          title: "Login required",
          description: "Please log in to like stories.",
          variant: "destructive"
        });
        return;
      }

      const result = await toggleReaction.mutateAsync({ 
        storyId: story.id, 
        reactionType: 'like' 
      });
      
      if (result?.action === 'added') {
        setIsLiked(true);
        setCurrentLikes(prev => prev + 1);
      } else if (result?.action === 'removed') {
        setIsLiked(false);
        setCurrentLikes(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle like. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleComment = async () => {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
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
      <div className="bg-white rounded-3xl shadow-soft border border-juice-orange/10 overflow-hidden mb-4">
        {/* Header */}
        <div className="p-4 border-b border-juice-orange/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-juice-orange/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-juice-orange">
                  {(subjectName || 'Anonymous').charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground">{story.subject_name || subjectName || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{formatDate(story.created_at)}</span>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
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
                    <div className="aspect-[4/3] bg-muted">
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
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{story.content}</p>
          
          {story.location && (
            <p className="text-sm text-muted-foreground">📍 {story.location}</p>
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

          {/* Ratings */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Communication:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < story.communication_rating ? 'fill-juice-orange text-juice-orange' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Loyalty:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < story.loyalty_rating ? 'fill-juice-pink text-juice-pink' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Safety:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < story.emotional_safety_rating ? 'fill-juice-green text-juice-green' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Vibe:</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < story.overall_vibe_rating ? 'fill-juice-blue text-juice-blue' : 'text-gray-300'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between pt-3 border-t border-juice-orange/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{currentLikes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleComment}
              className="flex items-center gap-2 text-muted-foreground"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{story.comments_count}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-muted-foreground"
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Author attribution */}
          <div className="pt-2 border-t border-juice-orange/5 mt-2">
            <button 
              onClick={handleAuthorClick}
              className="text-xs text-muted-foreground hover:text-juice-blue transition-smooth cursor-pointer"
            >
              Posted by: {authorName}
            </button>
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
