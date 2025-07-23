import { Heart, MessageCircle, Flag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  };
}

const StoryCard = ({ story }: StoryCardProps) => {
  const averageRating = (
    story.ratings.communication +
    story.ratings.loyalty +
    story.ratings.emotionalSafety +
    story.ratings.overallVibe
  ) / 4;

  return (
    <div className="bg-gradient-card border border-juice-blue/10 rounded-3xl p-6 shadow-card hover:shadow-soft transition-smooth mb-4">
      {/* Rating Stars */}
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.round(averageRating)
                ? "fill-juice-coral text-juice-coral"
                : "text-muted-foreground"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-2">
          {averageRating.toFixed(1)}
        </span>
      </div>

      {/* Story Content */}
      <p className="text-foreground leading-relaxed mb-4 text-base">
        {story.content}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {story.tags.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="bg-juice-lavender text-juice-blue rounded-full px-3 py-1 text-sm font-medium"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Detailed Ratings */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Communication</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < story.ratings.communication
                    ? "fill-juice-blue text-juice-blue"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Loyalty</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < story.ratings.loyalty
                    ? "fill-juice-sage text-juice-sage"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Emotional Safety</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < story.ratings.emotionalSafety
                    ? "fill-juice-peach text-juice-peach"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Overall Vibe</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < story.ratings.overallVibe
                    ? "fill-juice-coral text-juice-coral"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-juice-blue/5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            {story.reactions}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {story.comments}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{story.timeAgo}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Flag className="h-3 w-3 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;