import { useCallback, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Button } from "@/components/ui/button";
import { useInfiniteStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading: storiesLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteStories();

  const stories = useMemo(
    () => data?.pages.flatMap((p) => p) ?? [],
    [data]
  );

  // Pull-to-refresh: reset the infinite feed back to page 0, then refetch.
  const handleRefresh = useCallback(async () => {
    await queryClient.resetQueries({ queryKey: ['stories', 'infinite'] });
    await refetch();
  }, [queryClient, refetch]);
  const { pullDistance, status } = usePullToRefresh({ onRefresh: handleRefresh });

  // Infinite scroll: load the next page when sentinel enters the viewport.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, stories.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />
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
      <div className="max-w-md lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-8">
        {storiesLoading && stories.length === 0 ? (
          <div className="space-y-4 lg:space-y-0 lg:columns-2 xl:columns-3 lg:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="lg:break-inside-avoid lg:mb-4">
                <StoryCardSkeleton />
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <>
            {/* Single column on mobile, masonry-like CSS columns on desktop */}
            <div className="space-y-4 lg:space-y-0 lg:columns-2 xl:columns-3 lg:gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="lg:break-inside-avoid lg:mb-4"
                >
                  <StoryCard
                    story={story}
                    authorName={story.profiles?.anonymous_username || 'Anonymous'}
                    user_id={user?.id}
                  />
                </div>
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={`sk-${i}`} className="lg:break-inside-avoid lg:mb-4">
                    <StoryCardSkeleton />
                  </div>
                ))}
            </div>

            {/* Infinite-scroll sentinel + loader */}
            <div ref={sentinelRef} className="h-1" aria-hidden />
            {!hasNextPage && (
              <div className="py-6 text-center text-xs text-muted-foreground/70">
                You're all caught up.
              </div>
            )}
          </>
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

      <Navigation onCreateStory={onCreateStory} />
      <ScrollToTopButton />
    </div>
  );
};

export default Home;