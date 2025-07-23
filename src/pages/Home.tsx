import { useState } from "react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, TrendingUp, Clock } from "lucide-react";
// import juiceLogo from "@/assets/juice-logo.png";
import { useStories } from "@/hooks/useStories";
import { formatDistanceToNow } from "date-fns";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { data: stories = [], isLoading } = useStories();

  // Transform stories for StoryCard component
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
    timeAgo: formatDistanceToNow(new Date(story.created_at), { addSuffix: true }),
    codename: {
      id: story.codenames.id,
      display_name: story.codenames.display_name,
      emoji: story.codenames.emoji,
      description: story.codenames.description,
    },
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-8 w-8" />
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Juice
            </h1>
          </div>
          <Button variant="juice-outline" size="sm">
            Invite Friends
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Feed Tabs */}
        <Tabs defaultValue="latest" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-juice-lavender/50 rounded-2xl p-1">
            <TabsTrigger
              value="latest"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="curated"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Curated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-lg">Loading stories...</div>
              </div>
            ) : transformedStories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No stories yet
                </h3>
                <p className="text-muted-foreground">
                  Be the first to share your dating story!
                </p>
              </div>
            ) : (
              transformedStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-juice-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Trending Stories
              </h3>
              <p className="text-muted-foreground">
                The hottest tea is brewing... Check back soon!
              </p>
            </div>
          </TabsContent>

          <TabsContent value="curated" className="mt-6">
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-juice-blue mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Curated Collection
              </h3>
              <p className="text-muted-foreground">
                Hand-picked stories for your reading pleasure
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default Home;