import { MapPin, Heart, MessageCircle, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Story } from "@/hooks/useStories";

interface StoryPreviewProps {
  story: Story & {
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
  };
  onClick: () => void;
}

export const StoryPreview = ({ story, onClick }: StoryPreviewProps) => {
  const getImageUrls = (imageUrl: string | null): string[] => {
    if (!imageUrl) return [];
    try {
      return imageUrl.split(',').map(url => url.trim()).filter(url => url.length > 0);
    } catch {
      return [];
    }
  };

  const imageUrls = getImageUrls(story.image_url || null);
  const hasImage = imageUrls.length > 0;
  const authorName = story.profiles?.anonymous_username || 'Anonymous';

  return (
    <Card 
      className="modern-card overflow-hidden cursor-pointer hover:scale-[1.02] transition-all duration-200 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="aspect-square relative">
        {hasImage ? (
          <img
            src={imageUrls[0]}
            alt="Story preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-subtle flex items-center justify-center">
            <div className="text-center p-4">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground line-clamp-3">
                {story.content.substring(0, 100)}...
              </p>
            </div>
          </div>
        )}

        {/* Overlay with author info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-white text-sm font-medium">
              @{authorName}
            </span>
          </div>

          {/* Location */}
          {story.cities && (
            <div className="flex items-center gap-1 text-white/90 text-xs mb-1">
              <MapPin className="h-3 w-3" />
              <span>
                {story.cities.city_name}
                {story.distance && ` • ${story.distance}mi`}
              </span>
            </div>
          )}

          {/* Engagement stats */}
          <div className="flex items-center gap-3 text-white/80 text-xs">
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span>{story.reactions_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{story.comments_count || 0}</span>
            </div>
          </div>
        </div>

        {/* Multi-image indicator */}
        {imageUrls.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
            {imageUrls.length}
          </div>
        )}
      </div>
    </Card>
  );
};