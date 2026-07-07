import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BrandLockup from "@/components/BrandLockup";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import QueryError from "@/components/QueryError";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useInfiniteStories } from "@/hooks/useStories";
import { useFeedGate } from "@/hooks/useFeedGate";
import ReferralPrompt from "@/components/ReferralPrompt";
import SubjectLookup from "@/components/SubjectLookup";
import CityFilterChips, { FeedScope } from "@/components/CityFilterChips";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface HomeProps {
  onCreateStory?: () => void;
}

const Home = ({ onCreateStory }: HomeProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { feedMode, isLoading: gateLoading } = useFeedGate(user?.id);

  // "All" vs "my city" feed scope. City comes from the user's profile;
  // CityFilterChips opens the picker when no city is saved yet.
  const [scope, setScope] = useState<FeedScope>("all");
  // True while a name lookup is active — the feed steps aside for the results.
  const [lookupActive, setLookupActive] = useState(false);
  const { profile } = useProfile(user);
  const profileCityId = (profile as { city_id?: string | null } | null)?.city_id ?? null;
  const cityFilterId = scope === "city" ? profileCityId : null;

  // Chronological paginated feed — newest first. (No geolocation/"near me" sorting;
  // discovery is by city via search/filter, not device GPS.)
  const {
    data: infiniteData,
    isLoading: infiniteLoading,
    isError: storiesError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchInfinite,
  } = useInfiniteStories(undefined, feedMode, true, cityFilterId);

  const stories = useMemo(
    () => infiniteData?.pages?.flatMap((p) => p) ?? [],
    [infiniteData]
  );
  const storiesLoading = infiniteLoading || gateLoading;

  const handleRefresh = useCallback(async () => {
    await queryClient.resetQueries({ queryKey: ["stories", "infinite"] });
    await refetchInfinite();
  }, [queryClient, refetchInfinite]);

  const { pullDistance, status } = usePullToRefresh({ onRefresh: handleRefresh });

  // Infinite scroll sentinel.
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
          <Link to="/app" aria-label="Juice home">
            <BrandLockup variant="inline" size="sm" />
          </Link>
          <button
            onClick={() => navigate('/activity')}
            aria-label="Activity"
            className="min-h-11 min-w-11 -mr-2 flex items-center justify-center text-foreground hover:text-primary transition-colors"
          >
            <Heart className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
      </header>

      {/* Feed */}
      <div className="max-w-xl mx-auto sm:px-0 py-0 sm:py-2">
        {/* The magic moment, front and center: look her up by name. */}
        <SubjectLookup
          user_id={user?.id}
          onCreateStory={onCreateStory}
          onActiveChange={setLookupActive}
        />

        {lookupActive ? null : (
        <>
        <CityFilterChips scope={scope} onScopeChange={setScope} cityId={profileCityId} />

        {/* Catches users who verified before answering the referral question */}
        {user && <ReferralPrompt userId={user.id} />}

        {storiesLoading && stories.length === 0 ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : storiesError && stories.length === 0 ? (
          <QueryError
            title="Couldn't load the feed"
            message="Something went wrong loading stories. Check your connection and try again."
            onRetry={handleRefresh}
          />
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
              {scope === "city" ? "No stories in your city yet" : "No stories yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {scope === "city"
                ? "Be the first to share the Juice in your city — or browse everywhere."
                : "Be the first to share your dating story."}
            </p>
            {scope === "city" && (
              <button
                onClick={() => setScope("all")}
                className="mr-3 border border-border text-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Show all stories
              </button>
            )}
            <button
              onClick={onCreateStory}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Share the Juice
            </button>
          </div>
        )}
        </>
        )}
      </div>

      <Navigation onCreateStory={onCreateStory} />
      <ScrollToTopButton />
    </div>
  );
};

export default Home;
