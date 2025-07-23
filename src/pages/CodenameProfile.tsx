import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/StoryCard";
import { useCodename, useStoriesByCodename } from "@/hooks/useStories";

const CodenameProfile = () => {
  const { codenameId } = useParams();
  const navigate = useNavigate();
  
  const { data: codename, isLoading: codenameLoading } = useCodename(codenameId!);
  const { data: stories = [], isLoading: storiesLoading } = useStoriesByCodename(codenameId!);

  if (codenameLoading || storiesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!codename) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">Codename not found</div>
        </div>
      </div>
    );
  }

  // Calculate average ratings from all stories
  const averageRatings = stories.reduce(
    (acc, story) => {
      acc.communication += story.communication_rating;
      acc.loyalty += story.loyalty_rating;
      acc.emotionalSafety += story.emotional_safety_rating;
      acc.overallVibe += story.overall_vibe_rating;
      return acc;
    },
    { communication: 0, loyalty: 0, emotionalSafety: 0, overallVibe: 0 }
  );

  const storyCount = stories.length;
  if (storyCount > 0) {
    averageRatings.communication = Math.round(averageRatings.communication / storyCount);
    averageRatings.loyalty = Math.round(averageRatings.loyalty / storyCount);
    averageRatings.emotionalSafety = Math.round(averageRatings.emotionalSafety / storyCount);
    averageRatings.overallVibe = Math.round(averageRatings.overallVibe / storyCount);
  }

  const overallAverage = storyCount > 0 
    ? (averageRatings.communication + averageRatings.loyalty + averageRatings.emotionalSafety + averageRatings.overallVibe) / 4 
    : 0;

  // Transform stories to match StoryCard interface
  const transformedStories = stories.map(story => ({
    id: story.id,
    content: story.content,
    tags: story.story_tags.map(tag => tag.tag),
    ratings: {
      communication: story.communication_rating,
      loyalty: story.loyalty_rating,
      emotionalSafety: story.emotional_safety_rating,
      overallVibe: story.overall_vibe_rating,
    },
    reactions: story.reactions_count,
    comments: story.comments_count,
    timeAgo: new Date(story.created_at).toLocaleDateString(),
    codename: {
      id: story.codename_id,
      display_name: codename.display_name,
      emoji: codename.emoji,
    },
  }));

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Codename Profile Header */}
        <div className="bg-gradient-to-br from-juice-lavender/20 to-juice-blue/10 rounded-2xl p-6 mb-6">
          <div className="text-center">
            {codename.emoji && (
              <div className="text-4xl mb-3">{codename.emoji}</div>
            )}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {codename.display_name}
            </h1>
            {codename.description && (
              <p className="text-muted-foreground mb-4">{codename.description}</p>
            )}
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-juice-blue">{storyCount}</div>
                <div className="text-sm text-muted-foreground">
                  {storyCount === 1 ? 'Story' : 'Stories'}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold text-juice-blue">
                    {overallAverage.toFixed(1)}
                  </span>
                  <Star className="h-5 w-5 fill-juice-blue text-juice-blue" />
                </div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
            </div>

            {/* Detailed Ratings */}
            {storyCount > 0 && (
              <div className="mt-4 pt-4 border-t border-juice-blue/20">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Communication</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < averageRatings.communication
                              ? "fill-juice-blue text-juice-blue"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Loyalty</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < averageRatings.loyalty
                              ? "fill-juice-blue text-juice-blue"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Emotional Safety</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < averageRatings.emotionalSafety
                              ? "fill-juice-blue text-juice-blue"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Overall Vibe</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < averageRatings.overallVibe
                              ? "fill-juice-blue text-juice-blue"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stories */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            All Stories from {codename.display_name}
          </h2>
          
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No stories yet
              </h3>
              <p className="text-muted-foreground">
                This codename hasn't shared any stories yet.
              </p>
            </div>
          ) : (
            transformedStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CodenameProfile;