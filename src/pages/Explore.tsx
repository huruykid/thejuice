
import { useState } from "react";
import { Search, TrendingUp, Hash, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StoryCard from "@/components/StoryCard";
import Navigation from "@/components/Navigation";
import { useSearchStories } from "@/hooks/useSearchStories";
import { useTopTags } from "@/hooks/useTopTags";
import { useAuth } from "@/hooks/useAuth";

interface ExploreProps {
  onCreateStory?: () => void;
}

const Explore = ({ onCreateStory }: ExploreProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { user } = useAuth();

  // Use the search hook
  const { 
    data: searchResults = [], 
    isLoading: isSearchLoading, 
    refetch: refetchSearch 
  } = useSearchStories(searchQuery);

  // Use the top tags hook
  const { data: topTags = [] } = useTopTags();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetchSearch();
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSearchQuery(tag);
    refetchSearch();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="p-4 max-w-md mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Explore Stories
          </h1>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories, tags, or topics..."
              className="pl-10 rounded-2xl border-juice-blue/20 focus:border-juice-blue"
            />
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="trending" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-juice-lavender/50 rounded-2xl p-1">
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              Tags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-6">
            {searchQuery ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Search Results for "{searchQuery}"
                  </h2>
                  <Button
                    variant="juice-outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTag(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                {isSearchLoading ? (
                  <div className="text-center py-12">
                    <div className="text-lg">Searching...</div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground">
                      Try a different search term or browse trending stories
                    </p>
                  </div>
                ) : (
                  searchResults.map((story) => (
                    <StoryCard 
                      key={story.id} 
                      story={story} 
                      authorName={story.profiles?.anonymous_username || 'Anonymous'}
                      user_id={user?.id}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-juice-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Discover Stories
                </h3>
                <p className="text-muted-foreground mb-4">
                  Search for stories, tags, or topics you're interested in
                </p>
                <Button variant="juice-outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Browse Categories
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Popular Tags
              </h2>
              
              {topTags.length === 0 ? (
                <div className="text-center py-12">
                  <Hash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No tags yet
                  </h3>
                  <p className="text-muted-foreground">
                    Tags will appear here as people share stories
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {topTags.map((tagData) => (
                    <Badge
                      key={tagData.tag}
                      variant="outline"
                      className="cursor-pointer border-juice-blue/30 text-juice-blue hover:bg-juice-blue hover:text-white transition-smooth rounded-full px-3 py-1 flex items-center gap-1"
                      onClick={() => handleTagClick(tagData.tag)}
                    >
                      <Hash className="h-3 w-3" />
                      {tagData.tag}
                      <span className="text-xs ml-1 opacity-70">
                        {tagData.count}
                      </span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default Explore;
