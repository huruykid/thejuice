import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import StoryCard from "@/components/StoryCard";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useStories } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";

import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNearbyStories } from "@/hooks/useNearbyStories";
import { LocationPrompt } from "@/components/LocationPrompt";
import { LocationFilter } from "@/components/LocationFilter";

interface HomeProps {
  onCreateStory?: () => void;
}
const Home = ({
  onCreateStory
}: HomeProps) => {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState<number | null>(25);
  
  const {
    data: allStories = [],
    isLoading
  } = useStories();
  
  const {
    user
  } = useAuth();
  
  
  const {
    toast
  } = useToast();

  const {
    coordinates,
    isLoading: isLocationLoading,
    error: locationError,
    requestLocation,
    clearLocation,
    permissionState,
  } = useGeolocation();

  const {
    data: nearbyStories = [],
    isLoading: isNearbyLoading,
  } = useNearbyStories({
    userLocation: coordinates || { latitude: 0, longitude: 0 },
    radiusMiles: selectedRadius || undefined,
    enabled: !!coordinates && selectedRadius !== null,
  });

  // Show location prompt on first visit if location not granted
  useEffect(() => {
    const hasSeenPrompt = localStorage.getItem('hasSeenLocationPrompt');
    if (!hasSeenPrompt && !coordinates && permissionState !== 'denied') {
      setShowLocationPrompt(true);
    }
  }, [coordinates, permissionState]);

  // Use nearby stories if available, otherwise fall back to all stories
  const stories = coordinates && selectedRadius !== null ? nearbyStories : allStories;

  const handleRequestLocation = () => {
    requestLocation();
    localStorage.setItem('hasSeenLocationPrompt', 'true');
  };

  const handleDismissLocationPrompt = () => {
    setShowLocationPrompt(false);
    localStorage.setItem('hasSeenLocationPrompt', 'true');
  };

  const handleClearLocation = () => {
    clearLocation();
    setSelectedRadius(null);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-secondary to-background pb-20">
      {/* Modern Header with Glass Effect */}
      <div className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" 
                alt="Juice" 
                className="h-10 w-10 rounded-2xl shadow-lg animate-float" 
              />
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl opacity-30 blur-sm"></div>
            </div>
            <h1 className="text-lg font-display font-bold gradient-text">
              The Juice App
            </h1>
          </div>
        </div>
      </div>

      {/* Enhanced Content Section */}
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Location Features */}
        {showLocationPrompt && (
          <LocationPrompt
            onRequestLocation={handleRequestLocation}
            onDismiss={handleDismissLocationPrompt}
            isLoading={isLocationLoading}
          />
        )}

        {locationError && (
          <div className="modern-card p-4 mb-6 border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <MapPin className="h-4 w-4" />
              <span>{locationError}</span>
            </div>
          </div>
        )}

        <LocationFilter
          userLocation={coordinates}
          selectedRadius={selectedRadius}
          onRadiusChange={setSelectedRadius}
          nearbyCount={nearbyStories.length}
          onClearLocation={handleClearLocation}
        />

        {/* Stories Feed with Modern Layout */}
        <div className="space-y-6">
          {(isLoading || isNearbyLoading) ? (
            <div className="text-center py-16">
              <div className="animate-pulse-glow">
                <div className="w-16 h-16 bg-gradient-primary rounded-3xl mx-auto mb-4 animate-bounce-in"></div>
                <div className="text-lg font-medium text-muted-foreground">Loading stories...</div>
              </div>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-16">
              <div className="modern-card p-8 max-w-sm mx-auto">
                <div className="text-6xl mb-6 animate-float">📝</div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-3">
                  No stories yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share your dating story and get the conversation started!
                </p>
                <Button 
                  variant="gradient" 
                  onClick={onCreateStory}
                  className="animate-bounce-in"
                >
                  Share Your Story
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stories.map((story, index) => (
                <div 
                  key={story.id} 
                  className="animate-fade-in modern-card hover:shadow-glow transition-all duration-300"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <StoryCard 
                    story={story} 
                    authorName={story.profiles?.anonymous_username || 'Anonymous'} 
                    user_id={user?.id} 
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Navigation onCreateStory={onCreateStory} />
    </div>
  );
};
export default Home;