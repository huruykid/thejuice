import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteStories } from "@/hooks/useStories";
import { useStoriesByCity } from "@/hooks/useStoriesByCity";
import { useHasApprovedPost } from "@/hooks/useHasApprovedPost";
import UnlockBanner from "@/components/UnlockBanner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import CityFilterChips, { type FeedScope } from "@/components/CityFilterChips";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [scope, setScope] = useState<FeedScope>("all");
  const cityId = (profile as any)?.city_id as string | null | undefined;
  // If the user clears their city, fall back to All.
  useEffect(() => {
    if (scope === "city" && !cityId) setScope("all");
  }, [scope, cityId]);

  const { data: hasApprovedPost, isLoading: gateLoading } =
    useHasApprovedPost(user?.id);
  const feedMode: "community" | "seed" = hasApprovedPost ? "community" : "seed";
  const useCity = scope === "city" && !!cityId;

  const {
    data: allData,
    isLoading: allLoading,
    isFetchingNextPage: allFetchingNext,
    fetchNextPage: allFetchNext,
    hasNextPage: allHasNext,
    refetch: refetchAll,
  } = useInfiniteStories(undefined, feedMode);

  const {
    data: cityData,
    isLoading: cityLoading,
    isFetchingNextPage: cityFetchingNext,
    fetchNextPage: cityFetchNext,
    hasNextPage: cityHasNext,
    refetch: refetchCity,
  } = useStoriesByCity(useCity ? cityId : null);

  const stories = useMemo(() => {
    const pages = useCity ? cityData?.pages : allData?.pages;
    return pages?.flatMap((p) => p) ?? [];
  }, [useCity, allData, cityData]);

  const storiesLoading = useCity ? cityLoading : allLoading;
  const isFetchingNextPage = useCity ? cityFetchingNext : allFetchingNext;
  const hasNextPage = useCity ? cityHasNext : allHasNext;
  const fetchNextPage = useCity ? cityFetchNext : allFetchNext;

  // Pull-to-refresh: reset the infinite feed back to page 0, then refetch.
  const handleRefresh = useCallback(async () => {
    if (useCity) {
      await queryClient.resetQueries({ queryKey: ["stories", "by-city", cityId] });
      await refetchCity();
    } else {
      await queryClient.resetQueries({ queryKey: ["stories", "infinite"] });
      await refetchAll();
    }
  }, [queryClient, refetchAll, refetchCity, useCity, cityId]);
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
      {/* IG-style sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 h-12 max-w-md mx-auto">
          <h1 className="ig-wordmark">
            The <span className="accent">Juice</span> App
          </h1>
          <button
            onClick={() => navigate('/activity')}
            aria-label="Activity"
            className="p-1 -mr-1 text-foreground hover:text-primary transition-colors"
          >
            <Heart className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto sticky top-12 lg:top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <CityFilterChips scope={scope} onScopeChange={setScope} cityId={cityId} />
      </div>

      {/* Feed — IG full-bleed on mobile, narrow column on desktop */}
      <div className="max-w-xl mx-auto sm:px-0 py-0 sm:py-2">
        {feedMode === "seed" && (
          <UnlockBanner onCreateStory={onCreateStory} />
        )}
        {(storiesLoading || gateLoading) && stories.length === 0 ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : stories.length > 0 ? (
          <>
            {/* Single-column chronological feed */}
            <div>
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

            <div ref={sentinelRef} className="h-1" aria-hidden />
            {!hasNextPage && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                You're all caught up
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-20 text-center">
            <h3 className="text-lg font-semibold mb-1">
              {useCity ? "No juice here yet" : "No stories yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {useCity
                ? "Be the first to post from your city."
                : "Be the first to share your dating story."}
            </p>
            <button
              onClick={onCreateStory}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Share your story
            </button>
          </div>
        )}
      </div>

      <Navigation onCreateStory={onCreateStory} />
      <ScrollToTopButton />
    </div>
  );
};

export default Home;