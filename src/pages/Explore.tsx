import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import QueryError from "@/components/QueryError";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useStories } from "@/hooks/useStories";
import type { Story } from "@/hooks/useStories";

interface ExploreProps {
  onCreateStory?: () => void;
}

/**
 * Pull the first image URL from a story.
 * The DB stores image_url as a JSON-encoded string array, e.g. '["https://..."]'.
 * Matches the parsing logic in StoryCard.getImageUrls().
 */
const firstImage = (story: any): string | null => {
  if (!story?.image_url) return null;
  try {
    const parsed = JSON.parse(story.image_url);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {
    // Fallback: treat as a plain URL string
    if (typeof story.image_url === "string") return story.image_url;
  }
  return null;
};

const Explore = ({ onCreateStory }: ExploreProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: allStories, isLoading: allStoriesLoading, isError: allStoriesError, refetch: refetchStories } = useStories();
  const {
    searchResults,
    isSearching: searchLoading,
    performSearch,
    clearResults,
  } = useUnifiedSearch();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["stories"] });
  }, [queryClient]);

  const { pullDistance, status } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !!searchQuery,
  });

  useEffect(() => {
    if (debouncedSearchQuery) {
      performSearch(debouncedSearchQuery);
    } else {
      clearResults();
    }
  }, [debouncedSearchQuery]);

  // Deep-link: /explore?story=<id> — navigate to story page once stories load.
  // If the story isn't in allStories (no image, or not yet loaded), navigate anyway
  // without state so StoryDetail falls back to its own Supabase fetch.
  useEffect(() => {
    const storyId = searchParams.get("story");
    if (!storyId) return;
    // Wait until the allStories query has settled (either data or empty array).
    if (allStories === undefined) return;
    // Always clear the param first to avoid running again.
    setSearchParams({}, { replace: true });
    const target = allStories.find((s) => s.id === storyId);
    navigate(`/story/${storyId}`, {
      state: target ? { story: target } : undefined,
      replace: true,
    });
  }, [allStories, searchParams]);

  const getDisplayStories = (): Story[] => {
    if (debouncedSearchQuery && searchResults) {
      return searchResults
        .filter((r) => r.type === "story")
        .map((r) => r.story)
        .filter(Boolean) as Story[];
    }
    return (allStories ?? []) as Story[];
  };

  const displayStories = getDisplayStories();
  const isLoading = allStoriesLoading || searchLoading;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-3 py-2 max-w-3xl mx-auto">
          <form onSubmit={(e) => e.preventDefault()} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories or @users"
              aria-label="Search stories or users"
              className="pl-9 h-9 bg-muted border-0 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/40"
            />
          </form>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-0.5 pt-0.5">
        {isLoading && displayStories.length === 0 ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : allStoriesError && !debouncedSearchQuery && displayStories.length === 0 ? (
          <QueryError
            title="Couldn't load stories"
            message="Something went wrong. Check your connection and try again."
            onRetry={refetchStories}
          />
        ) : displayStories.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <h3 className="text-lg font-semibold mb-1">
              {debouncedSearchQuery ? "No stories found" : "Nothing here yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {debouncedSearchQuery ? "Try a different search." : "Check back soon for new stories."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {displayStories.map((story: any) => {
              const img = firstImage(story);
              return (
                <button
                  key={story.id}
                  onClick={() => navigate(`/story/${story.id}`, { state: { story } })}
                  className="relative aspect-square overflow-hidden bg-muted active:opacity-80 transition-opacity"
                  aria-label={story.content?.slice(0, 60) || "View story"}
                >
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary p-3 flex items-center justify-center text-center">
                      <p className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-6 text-primary-foreground">
                        "{story.content}"
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Navigation onCreateStory={onCreateStory} />
      <ScrollToTopButton />
    </div>
  );
};

export default Explore;
