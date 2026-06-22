import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, TrendingUp, Hash, Users, Phone, User, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StoryCard from "@/components/StoryCard";
import Navigation from "@/components/Navigation";
import StoryCardSkeleton from "@/components/StoryCardSkeleton";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import ProfileSearch from "@/components/ProfileSearch";
import { StoryPreview } from "@/components/StoryPreview";
import { StoryModal } from "@/components/StoryModal";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useTopTags } from "@/hooks/useTopTags";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useStories } from "@/hooks/useStories";
import { useTrendingStories } from "@/hooks/useTrendingStories";
import type { Story } from "@/hooks/useStories";

interface ExploreProps {
  onCreateStory?: () => void;
}

const Explore = ({ onCreateStory }: ExploreProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showTrending, setShowTrending] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { 
    data: allStories,
    isLoading: allStoriesLoading
  } = useStories();

  const { 
    searchResults, 
    isSearching: searchLoading,
    performSearch,
    clearResults
  } = useUnifiedSearch();

  const {
    data: trendingStories,
    isLoading: trendingLoading,
  } = useTrendingStories();

  const { data: topTags, isLoading: tagsLoading } = useTopTags();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['stories'] });
    await queryClient.invalidateQueries({ queryKey: ['trending-stories'] });
    await queryClient.invalidateQueries({ queryKey: ['top-tags'] });
  }, [queryClient]);
  const { pullDistance, status } = usePullToRefresh({
    onRefresh: handleRefresh,
    disabled: !!searchQuery,
  });

  // Search when query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      performSearch(debouncedSearchQuery);
    } else {
      clearResults();
    }
  }, [debouncedSearchQuery]);

  // Determine what stories to show based on current filters
  const getDisplayStories = () => {
    if (debouncedSearchQuery && searchResults) {
      return searchResults.filter(result => result.type === 'story').map(result => result.story).filter(Boolean);
    }
    
    if (selectedTag) {
      return allStories?.filter(story => 
        story.story_tags?.some(tag => tag.tag === selectedTag)
      ) || [];
    }
    
    return showTrending ? trendingStories : allStories;
  };

  const displayStories = getDisplayStories() || [];
  const isLoading = allStoriesLoading || searchLoading || trendingLoading;

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
  };

  const formatPhoneDisplay = (phone: string | null): string => {
    if (!phone) return '';
    if (phone.startsWith('+1') && phone.length === 12) {
      const digits = phone.substring(2);
      return `+1 (${digits.substring(0,3)}) ${digits.substring(3,6)}-${digits.substring(6)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <PullToRefreshIndicator pullDistance={pullDistance} status={status} />
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="p-4 max-w-md lg:max-w-2xl mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Explore Stories
          </h1>
          
          {/* Enhanced Search Bar */}
          <div className="space-y-3">
            <form onSubmit={(e) => e.preventDefault()} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by @username or phone number"
                className="pl-10 rounded-2xl border-juice-blue/20 focus:border-juice-blue"
              />
            </form>
            
            {/* Popular Tags */}
            {!searchQuery && topTags && topTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {topTags.slice(0, 6).map((tag) => (
                  <Badge
                    key={tag.tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-juice-blue/20 transition-colors"
                    onClick={() => {
                      setSelectedTag(tag.tag);
                      setSearchQuery(`#${tag.tag}`);
                    }}
                  >
                    <Hash className="h-3 w-3 mr-1" />
                    {tag.tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md lg:max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="stories" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-juice-lavender/50 rounded-2xl p-1">
            <TabsTrigger
              value="stories"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
              onClick={() => setShowTrending(false)}
            >
              <TrendingUp className="h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
              onClick={() => setShowTrending(true)}
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="mt-6">
            {searchQuery ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Search Results for "{searchQuery}"
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTag(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                {searchLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <div className="text-lg">Searching...</div>
                  </div>
                ) : searchResults && searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Try searching for different keywords or usernames
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayStories.map((story) => (
                      <StoryCard 
                        key={story.id}
                        story={story} 
                        authorName={story.profiles?.anonymous_username || 'Anonymous'}
                        user_id={user?.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stories Grid */}
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <StoryCardSkeleton key={i} />
                    ))}
                  </div>
                ) : displayStories.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-juice-blue mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No stories yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to share a story
                    </p>
                    <Button 
                      onClick={onCreateStory}
                      className="bg-gradient-to-r from-juice-orange to-juice-pink hover:from-juice-orange/90 hover:to-juice-pink/90"
                    >
                      Share Your Story
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-foreground">
                        {showTrending ? "Trending Stories" : "Latest Stories"}
                      </h2>
                      <span className="text-sm text-muted-foreground">
                        {displayStories.length} stories
                      </span>
                    </div>

                    {/* Stories List */}
                    <div className="space-y-4">
                      {displayStories.map((story) => (
                        <StoryCard 
                          key={story.id}
                          story={story} 
                          authorName={story.profiles?.anonymous_username || 'Anonymous'}
                          user_id={user?.id}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="mt-6">
            {/* Same content as stories tab but with trending filter */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Story Modal */}
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