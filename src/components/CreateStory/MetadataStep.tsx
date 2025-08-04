import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CitySelector } from "@/components/ui/city-selector";
import type { StoryData } from "./index";
import type { City } from "@/hooks/useCities";

interface MetadataStepProps {
  storyData: StoryData;
  setStoryData: (updater: (prev: StoryData) => StoryData) => void;
  onPublish: () => void;
  onBack: () => void;
  isLoading: boolean;
  uploading: boolean;
}

const MetadataStep = ({
  storyData,
  setStoryData,
  onPublish,
  onBack,
  isLoading,
  uploading
}: MetadataStepProps) => {
  const handleCitySelect = (city: City | null) => {
    setSelectedCity(city);
    setStoryData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        city_id: city?.id || null
      }
    }));
  };

  // We'll need to get the selected city by ID, not by name
  // For now, let's simplify and just track the selected city in state
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const datingApps = [
    "Tinder", "Bumble", "Hinge", "Instagram", "IRL", "Raya", 
    "Facebook Dating", "Coffee Meets Bagel", "OkCupid", "Match", "eHarmony", "Other"
  ];

  const relationshipStages = [
    "First Date", "Hookup", "Casual Dating", "Talking Stage", "Exclusive", 
    "LTR", "Situationship", "Friends with Benefits", "One Night Stand"
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Additional Details (Optional)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <CitySelector
              value={selectedCity || null}
              onSelect={handleCitySelect}
              placeholder="Search and select your city..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Search and select your city from our database for consistent location data.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onPublish}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              {uploading ? "Uploading..." : "Publishing..."}
            </span>
          ) : (
            "Publish Story"
          )}
        </Button>
      </div>
    </div>
  );
};

export default MetadataStep;