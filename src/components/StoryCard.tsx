import { Heart, MessageCircle, Flag, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CodenameCard from "./CodenameCard";
import CommentsModal from "./CommentsModal";
import { useDeleteStory } from "@/hooks/useStories";
import { useToggleReaction } from "@/hooks/useReactions";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
    tags: string[];
    ratings: {
      communication: number;
      loyalty: number;
      emotionalSafety: number;
      overallVibe: number;
    };
    reactions: number;
    comments: number;
    timeAgo: string;
    imageUrl?: string;
    user_id?: string;
    codename?: {
      id: string;
      display_name: string;
      emoji: string | null;
      description?: string | null;
    };
  };
}

const StoryCard = ({ story }: StoryCardProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [userHasLiked, setUserHasLiked] = useState(false);
  
  const deleteStory = useDeleteStory();
  const toggleReaction = useToggleReaction();
  const { toast } = useToast();
  const vibeScore = Math.round(story.ratings.overallVibe * 20); // Convert 1-5 to 1-100
  
  // Check if current user owns this story and if they've liked it
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
      
      if (user) {
        // Check if user has liked this story
        const { data: reaction } = await supabase
          .from('reactions')
          .select('id')
          .eq('story_id', story.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'like')
          .maybeSingle();
        
        setUserHasLiked(!!reaction);
      }
    };
    getCurrentUser();
  }, [story.id]);

  const isOwner = currentUserId && story.user_id === currentUserId;
  
  // Get first 2 lines of content
  const getPreviewText = (text: string) => {
    const lines = text.split('\n');
    const preview = lines.slice(0, 2).join('\n');
    return preview.length < text.length ? preview + '...' : preview;
  };

  const getTagWithEmoji = (tag: string) => {
    const emoji = tagEmojis[tag.toLowerCase()] || '';
    return emoji ? `${emoji} ${tag}` : tag;
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    
    try {
      await deleteStory.mutateAsync(story.id);
      toast({
        title: "Story deleted",
        description: "Your story has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Please log in to like stories.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await toggleReaction.mutateAsync({ storyId: story.id });
      setUserHasLiked(result.action === 'added');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComment = () => {
    if (!currentUserId) {
      toast({
        title: "Login required",
        description: "Please log in to comment on stories.",
        variant: "destructive",
      });
      return;
    }
    setShowComments(true);
  };

  return (
    <div className="bg-gradient-card border border-juice-blue/10 rounded-3xl p-6 shadow-card hover:shadow-soft transition-smooth mb-4">
      {/* Codename */}
      {story.codename && (
        <div className="mb-3">
          <CodenameCard 
            codename={story.codename} 
            size="sm" 
          />
        </div>
      )}

      {/* Story Image */}
      {story.imageUrl && (
        <div className="mb-4">
          <img 
            src={story.imageUrl} 
            alt="Story image" 
            className="w-full h-48 object-cover rounded-lg border border-juice-blue/10"
          />
        </div>
      )}

      {/* Story Preview */}
      <p className="text-foreground leading-relaxed mb-4 text-base">
        {getPreviewText(story.content)}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {story.tags.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-juice-lavender text-juice-blue rounded-full px-3 py-1 text-sm font-medium"
          >
            {getTagWithEmoji(tag)}
          </Badge>
        ))}
      </div>

      {/* Vibe Score */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 fill-juice-coral text-juice-coral" />
          <span className="text-sm font-medium text-foreground">
            Vibe Score: {vibeScore}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-juice-blue/5">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 transition-colors ${
              userHasLiked 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-muted-foreground hover:text-red-500'
            }`}
            onClick={handleLike}
            disabled={toggleReaction.isPending}
          >
            <Heart className={`h-4 w-4 ${userHasLiked ? 'fill-current' : ''}`} />
            {story.reactions}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 text-muted-foreground hover:text-juice-blue transition-colors"
            onClick={handleComment}
          >
            <MessageCircle className="h-4 w-4" />
            {story.comments}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{story.timeAgo}</span>
          <div className="flex items-center gap-1">
            {isOwner && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={deleteStory.isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Flag className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      <CommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        storyId={story.id}
        storyPreview={getPreviewText(story.content)}
      />
    </div>
  );
};

export default StoryCard;