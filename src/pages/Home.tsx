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
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />
      {/* Brutalist Header */}
      <header className="sticky top-0 z-40 bg-background border-b-4 border-foreground lg:hidden">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary border-2 border-foreground flex items-center justify-center">
              <span className="font-display text-xl text-primary-foreground leading-none pt-0.5">J</span>
            </div>
            <h1 className="font-display text-3xl leading-none pt-1 tracking-tight">
              THE JUICE
            </h1>
          </div>
          <div className="w-10 h-10 border-2 border-foreground bg-accent flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-foreground" />
          </div>
        </div>
      </header>

      {/* Enhanced Content Section */}
      <div className="max-w-[640px] mx-auto px-4 py-6">
        {storiesLoading && stories.length === 0 ? (
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : stories.length > 0 ? (
          <>
            {/* Single-column chronological feed on every breakpoint */}
            <div className="space-y-8">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  authorName={story.profiles?.anonymous_username || 'Anonymous'}
                  user_id={user?.id}
                />
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 2 }).map((_, i) => (
                  <StoryCardSkeleton key={`sk-${i}`} />
                ))}
            </div>

            {/* Infinite-scroll sentinel + loader */}
            <div ref={sentinelRef} className="h-1" aria-hidden />
            {!hasNextPage && (
              <div className="py-8 text-center">
                <span className="brut-tag-ink">You're all caught up</span>
              </div>
            )}
          </>
        ) : (
          <div className="py-16">
            <div className="brut-card p-8 max-w-sm mx-auto text-center">
              <div className="font-display text-6xl text-primary mb-3 leading-none">📝</div>
              <h3 className="font-display text-3xl text-foreground mb-2 leading-none pt-2">
                NO TEA YET
              </h3>
              <p className="text-foreground/80 mb-6 font-medium">
                Be the first to spill. Get the gossip started.
              </p>
              <button
                onClick={onCreateStory}
                className="font-display text-xl bg-primary text-primary-foreground border-2 border-foreground shadow-brut-sm px-6 py-3 uppercase active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
              >
                Spill the Tea
              </button>
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