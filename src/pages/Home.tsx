import { useCallback, useEffect, useMemo, useRef } from "react";
import BrandLockup from "@/components/BrandLockup";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import LocationNudge from "@/components/LocationNudge";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteStories } from "@/hooks/useStories";
import { useNearbyStories } from "@/hooks/useNearbyStories";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFeedGate } from "@/hooks/useFeedGate";
import ReferralPrompt from "@/components/ReferralPrompt";
import { useAuth } from "@/hooks/useAuth";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { feedMode, isLoading: gateLoading } = useFeedGate(user?.id);

  // ─── Geolocation ────────────────────────────────────────────────────────────
  const { coordinates, permissionState, requestLocation } = useGeolocation();

  // If permission was already granted by a returning user, grab coords silently.
  useEffect(() => {
    if (permissionState === "granted" && !coordinates) {
      requestLocation();
    }
  }, [permissionState, coordinates, requestLocation]);

  // Use location-sorted feed only for community mode when coords are available.
  const useLocationFeed = feedMode === "community" && !!coordinates;

  // ─── Location-sorted feed (all stories, closest first) ─────────────────────
  const {
    data: nearbyStories = [],
    isLoading: nearbyLoading,
    refetch: refetchNearby,
  } = useNearbyStories(coordinates ?? null, useLocationFeed);

  // ─── Chronological paginated feed (fallback / seed mode) ───────────────────
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchInfinite,
  // Disable when using the location feed to prevent a redundant background fetch.
  } = useInfiniteStories(undefined, feedMode, !useLocationFeed);

  const infiniteStories = useMemo(
    () => infiniteData?.pages?.flatMap((p) => p) ?? [],
    [infiniteData]
  );

  const stories = useLocationFeed ? nearbyStories : infiniteStories;
  const storiesLoading = useLocationFeed ? nearbyLoading : infiniteLoading || gateLoading;

  // ─── Pull-to-refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    if (useLocationFeed) {
      await refetchNearby();
    } else {
      await queryClient.resetQueries({ queryKey: ["stories", "infinite"] });
      await refetchInfinite();
    }
  }, [queryClient, refetchNearby, refetchInfinite, useLocationFeed]);

  const { pullDistance, status } = usePullToRefresh({ onRefresh: handleRefresh });

  // ─── Infinite scroll sentinel (paginated feed only) ─────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (useLocationFeed) return;
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, useLocationFeed, stories.length]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />

      {/* IG-style sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border lg:hidden">
        <div className="flex items-center justify-between px-4 h-12 max-w-md mx-auto">
          <BrandLockup variant="inline" size="sm" />
          <button
            onClick={() => navigate('/activity')}
            aria-label="Activity"
            className="p-1 -mr-1 text-foreground hover:text-primary transition-colors"
          >
            <Heart className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>

        {/* One-time location nudge — only when permission hasn't been decided yet */}
        {feedMode === "community" && permissionState === "prompt" && (
          <LocationNudge onEnable={requestLocation} />
        )}
      </header>

      {/* Feed */}
      <div className="max-w-xl mx-auto sm:px-0 py-0 sm:py-2">
        {/* Catches users who verified before answering the referral question */}
        {user && <ReferralPrompt userId={user.id} />}

        {storiesLoading && stories.length === 0 ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : stories.length > 0 ? (
          <>
            <div>
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  authorName={story.profiles?.anonymous_username || "Anonymous"}
                  user_id={user?.id}
                />
              ))}
              {isFetchingNextPage &&
                Array.from({ length: 2 }).map((_, i) => (
                  <StoryCardSkeleton key={`sk-${i}`} />
                ))}
            </div>

            {!useLocationFeed && <div ref={sentinelRef} className="h-1" aria-hidden />}
            {(useLocationFeed || !hasNextPage) && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                You're all caught up
              </div>
            )}
          </>
        ) : (
          <div className="px-6 py-20 text-center">
            <h3 className="text-lg font-semibold mb-1">No stories yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to share your dating story.
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