
import { useState, useEffect } from "react";
import { Search, TrendingUp, Hash, Filter, Users, Phone, User, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StoryCard from "@/components/StoryCard";
import Navigation from "@/components/Navigation";
import ProfileSearch from "@/components/ProfileSearch";
import CitySearchTest from "@/components/CitySearchTest";
import { useSearchStories } from "@/hooks/useSearchStories";
import { useUnifiedSearch } from "@/hooks/useUnifiedSearch";
import { useTopTags } from "@/hooks/useTopTags";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";

interface ExploreProps {
  onCreateStory?: () => void;
}

const Explore = ({ onCreateStory }: ExploreProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { user } = useAuth();

  // Use the unified search hook for comprehensive search
  const { 
    isSearching: isUnifiedSearching, 
    searchResults: unifiedResults, 
    performSearch: performUnifiedSearch,
    clearResults: clearUnifiedResults
  } = useUnifiedSearch();

  // Use debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Use the top tags hook
  const { data: topTags = [] } = useTopTags();

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      performUnifiedSearch(debouncedSearchQuery);
    } else {
      clearUnifiedResults();
    }
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      performUnifiedSearch(searchQuery);
    }
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSearchQuery(tag);
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="p-4 max-w-md mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Explore Stories
          </h1>
          
          {/* Enhanced Search Bar */}
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories, @username, or +1-555-555-5555..."
                className="pl-10 rounded-2xl border-juice-blue/20 focus:border-juice-blue"
              />
            </form>
            
            {/* Quick Search Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>💡 <strong>Search Tips:</strong></p>
              <p>• Stories: "dating advice", "red flag"</p>
              <p>• People: @username or +1-555-555-5555</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="trending" className="mb-6">
          <TabsList className="grid w-full grid-cols-3 bg-juice-lavender/50 rounded-2xl p-1">
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger
              value="people"
              className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-card flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              People
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
                      clearUnifiedResults();
                    }}
                  >
                    Clear
                  </Button>
                </div>
                
                {isUnifiedSearching ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <div className="text-lg">Searching...</div>
                  </div>
                ) : unifiedResults.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Try searching for:
                    </p>
                    <ul className="text-muted-foreground text-sm mt-2 space-y-1">
                      <li>• @username (e.g., @admin)</li>
                      <li>• Phone number (+1 555-555-5555)</li>
                      <li>• Story content (e.g., "dating")</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unifiedResults.map((result, index) => {
                      if (result.type === 'profile' && result.profile) {
                        return (
                          <Card key={`profile-${result.profile.id}`} className="p-4">
                            <CardContent className="p-0">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarFallback>
                                    {result.profile.anonymous_username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">@{result.profile.anonymous_username}</span>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      {result.matchType === 'phone' ? (
                                        <>
                                          <Phone className="h-3 w-3" />
                                          <span>Phone match</span>
                                        </>
                                      ) : (
                                        <>
                                          <User className="h-3 w-3" />
                                          <span>Username match</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                   <div className="text-sm text-muted-foreground">
                                     {result.profile.city && `📍 ${result.profile.city}`}
                                     {result.matchType === 'phone' && result.profile.phone_number && 
                                       ` • ${formatPhoneDisplay(result.profile.phone_number)}`
                                     }
                                   </div>
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                        );
                      } else if (result.type === 'story' && result.story) {
                        return (
                          <div key={`story-${result.story.id}`} className="relative">
                            <StoryCard 
                              story={result.story} 
                              authorName={result.story.profiles?.anonymous_username || 'Anonymous'}
                              user_id={user?.id}
                            />
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="text-xs">
                                {result.matchType === 'content' && (
                                  <>
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    Story match
                                  </>
                                )}
                                {result.matchType === 'subject_name' && (
                                  <>
                                    <User className="h-3 w-3 mr-1" />
                                    Subject match
                                  </>
                                )}
                                {result.matchType === 'subject_phone' && (
                                  <>
                                    <Phone className="h-3 w-3 mr-1" />
                                    Phone match
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-juice-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Discover Stories & People
                </h3>
                <p className="text-muted-foreground mb-4">
                  Search for stories, people, or topics you're interested in
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Try searching for:</strong></p>
                  <p>• Stories: "dating advice", "red flag"</p>
                  <p>• People: @admin, +1-559-475-1807</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Find People
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Search for users by @username or phone number to find their stories
              </p>
              
              <ProfileSearch 
                placeholder="Search @username or +1 555-555-5555"
                onProfileSelect={(profileId, username) => {
                  console.log('Selected profile:', { profileId, username });
                  // You can implement navigation to profile or filtering stories by user
                  setSearchQuery(`@${username}`);
                }}
              />
              
              <div className="mt-4 p-4 bg-juice-lavender/20 rounded-xl">
                <h3 className="font-medium text-sm mb-2">How it works:</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Search by @username (e.g., @sarah)</li>
                  <li>• Search by phone number (+1 555-555-5555)</li>
                  <li>• Phone numbers are matched in international format</li>
                  <li>• Full number match only for privacy</li>
                </ul>
              </div>
              
              {/* City Search Test Component */}
              <div className="mt-6">
                <CitySearchTest />
              </div>
            </div>
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
