import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, ChevronDown } from "lucide-react";
import StoryCard from "@/components/StoryCard";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import CitySheet from "@/components/CitySheet";
import Navigation from "@/components/Navigation";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useStoriesByCity } from "@/hooks/useStoriesByCity";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface NearYouProps {
  onCreateStory?: () => void;
}

const NearYou = ({ onCreateStory }: NearYouProps) => {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const [pickerOpen, setPickerOpen] = useState(false);
  const queryClient = useQueryClient();

  const cityId = (profile as any)?.city_id as string | null | undefined;

  const { data: city } = useQuery({
    queryKey: ["city", cityId],
    enabled: !!cityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, city_name, state_province")
        .eq("id", cityId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useStoriesByCity(cityId);

  const stories = useMemo(() => data?.pages.flatMap((p) => p) ?? [], [data]);

  const handleRefresh = useCallback(async () => {
    await queryClient.resetQueries({ queryKey: ["stories", "by-city", cityId] });
    await refetch();
  }, [queryClient, refetch, cityId]);

  const { pullDistance, status } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !cityId,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const obs = new IntersectionObserver(
      (e) => e[0]?.isIntersecting && fetchNextPage(),
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, stories.length]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />

      {/* IG-style sticky header w/ city selector */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 h-12 max-w-xl mx-auto">
          <h1 className="text-base font-semibold">Near You</h1>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary" />
            {city?.city_name || "Pick a city"}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-0 py-2">
        {!cityId ? (
          <div className="px-6 py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Set your city</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Choose a city to see stories tagged to it. No location permissions needed.
            </p>
            <button
              onClick={() => setPickerOpen(true)}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Pick a city
            </button>
          </div>
        ) : isLoading && stories.length === 0 ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <h2 className="text-lg font-semibold mb-1">No stories yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Be the first to spill the tea in {city?.city_name}.
            </p>
            <button
              onClick={onCreateStory}
              className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              Share a story
            </button>
          </div>
        ) : (
          <>
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                authorName={(story as any).profiles?.anonymous_username || "Anonymous"}
                user_id={user?.id}
              />
            ))}
            {isFetchingNextPage &&
              Array.from({ length: 2 }).map((_, i) => <StoryCardSkeleton key={`sk-${i}`} />)}
            <div ref={sentinelRef} className="h-1" aria-hidden />
            {!hasNextPage && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                You're all caught up.
              </div>
            )}
          </>
        )}
      </div>

      <CitySheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentCityId={cityId}
      />
      <ScrollToTopButton />
      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default NearYou;