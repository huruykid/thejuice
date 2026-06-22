import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { useStories } from "@/hooks/useStories";
import { useTrendingStories } from "@/hooks/useTrendingStories";
import { useAuth } from "@/hooks/useAuth";
import LoadingSkeleton from "@/components/ui/loading-skeleton";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { user } = useAuth();
  
  const { 
    data: stories, 
    isLoading: storiesLoading, 
    refetch: refetchStories 
  } = useStories();
  
  const { 
    data: trendingStories, 
    isLoading: trendingLoading 
  } = useTrendingStories();

  const isLoading = storiesLoading || trendingLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background pb-20 lg:pb-8">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-40 glass border-b border-white/10 lg:hidden">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" 
                alt="Juice" 
                className="h-10 w-10 rounded-2xl shadow-lg animate-float" 
              />
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl opacity-30 blur-sm"></div>
            </div>
            <h1 className="text-lg font-display font-bold gradient-text">
              The Juice App
            </h1>
          </div>
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="max-w-md lg:max-w-2xl mx-auto px-4 py-8">
        {/* Stories */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton type="general" message="Loading stories..." />
          ) : stories && stories.length > 0 ? (
            stories.map((story) => (
              <StoryCard 
                key={story.id}
                story={story} 
                authorName={story.profiles?.anonymous_username || 'Anonymous'} 
                user_id={user?.id}
              />
            ))
          ) : (
            <div className="text-center py-16">
              <div className="modern-card p-8 max-w-sm mx-auto">
                <div className="text-6xl mb-6 animate-float">📝</div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  No stories yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share your dating story and get the conversation started!
                </p>
                <Button 
                  variant="gradient" 
                  onClick={onCreateStory}
                  className="animate-bounce-in"
                >
                  Share Your Story
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default Home;