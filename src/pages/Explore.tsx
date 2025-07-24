import { useState, useEffect, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, MapPin, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoryCard from "@/components/StoryCard";
import Navigation from "@/components/Navigation";
import { useSearchStories } from "@/hooks/useSearchStories";
import { useTopTags } from "@/hooks/useTopTags";
import { formatDistanceToNow } from "date-fns";

interface ExploreProps {
  onCreateStory?: () => void;
}

const Explore = ({ onCreateStory }: ExploreProps = {}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [userLocation, setUserLocation] = useState<string | null>(null);

  // Debounce search inputs to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedLocation = useDebounce(location, 500);

  const { data: searchResults = [], isLoading: isSearching } = useSearchStories(
    debouncedSearchQuery, 
    debouncedLocation, 
    selectedTag
  );
  const { data: topTags = [] } = useTopTags();

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            // In a real app, you'd use a geocoding service
            // For now, we'll just set a placeholder
            setUserLocation("Current Location");
          } catch (error) {
            console.error("Error getting location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  // Transform stories for StoryCard component
  const transformedStories = searchResults.map(story => ({
    id: story.id,
    content: story.content,
    tags: story.story_tags.map(tag => tag.tag),
    ratings: {
      communication: story.communication_rating,
      loyalty: story.loyalty_rating,
      emotionalSafety: story.emotional_safety_rating,
      overallVibe: story.overall_vibe_rating,
    },
    reactions: story.reactions_count,
    comments: story.comments_count,
    timeAgo: formatDistanceToNow(new Date(story.created_at), { addSuffix: true }),
    codename: {
      id: story.codenames.id,
      display_name: story.codenames.display_name,
      emoji: story.codenames.emoji,
      description: story.codenames.description,
    },
  }));

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? "" : tag);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-juice-blue/10 z-40">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            🔍 Explore
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories, codenames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl bg-juice-lavender/30 border-juice-blue/20"
          />
        </div>

        {/* Location Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-juice-blue" />
            <h2 className="text-lg font-semibold">Stories Near You</h2>
          </div>
          {userLocation && (
            <Badge variant="outline" className="mb-2">
              📍 {userLocation}
            </Badge>
          )}
          <Input
            placeholder="Enter city name..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-2xl bg-juice-lavender/30 border-juice-blue/20"
          />
        </div>

        {/* Top Tags */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-juice-blue" />
            <h2 className="text-lg font-semibold">Popular Tags</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {topTags.map(({ tag, count }) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? "default" : "secondary"}
                className={`cursor-pointer transition-colors ${
                  selectedTag === tag 
                    ? "bg-juice-blue text-white" 
                    : "bg-juice-lavender/50 hover:bg-juice-lavender/80"
                }`}
                onClick={() => handleTagClick(tag)}
              >
                {tag} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          {isSearching ? (
            <div className="text-center py-12">
              <div className="text-lg">Searching...</div>
            </div>
          ) : transformedStories.length === 0 && (searchQuery || location || selectedTag) ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No stories found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search filters
              </p>
            </div>
          ) : transformedStories.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {transformedStories.length} stories found
                </h3>
                {(searchQuery || location || selectedTag) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setLocation("");
                      setSelectedTag("");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              {transformedStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Start exploring
              </h3>
              <p className="text-muted-foreground">
                Search for stories, filter by location or tags
              </p>
            </div>
          )}
        </div>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};

export default Explore;