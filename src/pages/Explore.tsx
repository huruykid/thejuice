import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Search, Hash, MessageCircle, Flag } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { StoryModal } from "@/components/StoryModal";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useTopTags } from "@/hooks/useTopTags";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useStories } from "@/hooks/useStories";
import type { Story } from "@/hooks/useStories";

interface ExploreProps {
  onCreateStory?: () => void;
}

/** Pull the first available image off a story (covers image_urls / image_url). */
const firstImage = (story: any): string | null => {
  const arr = story?.image_urls;
  if (Array.isArray(arr) && arr.length > 0) return arr[0];
  if (typeof story?.image_url === "string") return story.image_url;
  return null;
};

const Explore = ({ onCreateStory }: ExploreProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data: allStories, isLoading: allStoriesLoading } = useStories();
  const {
    searchResults,
    isSearching: searchLoading,
    performSearch,
    clearResults,
  } = useUnifiedSearch();
  const { data: topTags } = useTopTags();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["stories"] });
    await queryClient.invalidateQueries({ queryKey: ["top-tags"] });
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

  // Deep-link: /explore?story=<id> — open the story modal once stories are loaded.
  useEffect(() => {
    const storyId = searchParams.get("story");
    if (!storyId || !allStories) return;
    const target = allStories.find((s) => s.id === storyId);
    if (target) {
      setSelectedStory(target);
      // Remove the param from the URL so Back/Forward behave naturally.
      setSearchParams({}, { replace: true });
    }
  }, [allStories, searchParams]);

  const getDisplayStories = (): Story[] => {
    if (debouncedSearchQuery && searchResults) {
      return searchResults
        .filter((r) => r.type === "story")
        .map((r) => r.story)
        .filter(Boolean) as Story[];
    }
    if (selectedTag) {
      return (allStories?.filter((s) =>
        s.story_tags?.some((t) => t.tag === selectedTag)
      ) ?? []) as Story[];
    }
    return (allStories ?? []) as Story[];
  };

  const displayStories = getDisplayStories();
  const isLoading = allStoriesLoading || searchLoading;

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-3 py-2 max-w-3xl mx-auto space-y-2">
          <form onSubmit={(e) => e.preventDefault()} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories, @users, or tags"
              className="pl-9 h-9 bg-muted border-0 text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-primary/40"
            />
          </form>
          {!searchQuery && topTags && topTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none">
              {topTags.slice(0, 8).map((tag) => {
                const active = selectedTag === tag.tag;
                return (
                  <button
                    key={tag.tag}
                    onClick={() => setSelectedTag(active ? null : tag.tag)}
                    className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-foreground text-background"
                        : "bg-muted text-foreground hover:bg-card-hover"
                    }`}
                  >
                    <Hash className="h-3 w-3" />
                    {tag.tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {isLoading && displayStories.length === 0 ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse" />
            ))}
          </div>
        ) : displayStories.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <h3 className="text-lg font-semibold mb-1">No stories found</h3>
            <p className="text-sm text-muted-foreground">
              Try a different search or tag.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {displayStories.map((story: any) => {
              const img = firstImage(story);
              return (
                <button
                  key={story.id}
                  onClick={() => setSelectedStory(story)}
                  className="relative aspect-square overflow-hidden bg-muted group"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={story.content?.slice(0, 60) || "Story"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary text-primary-foreground p-3 flex items-center justify-center text-center">
                      <p className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-6">
                        "{story.content}"
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-background text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Flag className="h-3.5 w-3.5" fill="currentColor" />
                      {(story as any).reaction_count ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" fill="currentColor" />
                      {story.comments_count ?? 0}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <StoryModal
        story={selectedStory}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        userId={user?.id}
      />

      <Navigation onCreateStory={onCreateStory} />
      <ScrollToTopButton />
    </div>
  );
};

export default Explore;