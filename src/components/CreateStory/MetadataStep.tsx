import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCities } from "@/hooks/useCities";
import type { StoryData } from "./index";

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
  const [cityInput, setCityInput] = useState(storyData.metadata?.location || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: cities = [], isLoading: citiesLoading } = useCities(cityInput);

  const handleCityChange = (value: string) => {
    setCityInput(value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    setStoryData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        location: value
      }
    }));
  };

  const handleCitySelect = (cityName: string) => {
    setCityInput(cityName);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setStoryData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        location: cityName
      }
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || cities.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < cities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : cities.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && cities[selectedIndex]) {
          const city = cities[selectedIndex];
          const cityName = `${city.city_name}, ${city.state_province || city.country}`;
          handleCitySelect(cityName);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
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
          <div className="relative">
            <label className="block text-sm font-medium mb-1">City</label>
            <Input
              ref={inputRef}
              value={cityInput}
              onChange={(e) => handleCityChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Start typing your city..."
              autoComplete="off"
            />
            
            {/* Autocomplete Suggestions */}
            {showSuggestions && cityInput.trim() && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {citiesLoading ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Loading cities...</div>
                ) : cities.length > 0 ? (
                  cities.map((city, index) => {
                    const cityName = `${city.city_name}, ${city.state_province || city.country}`;
                    return (
                      <div
                        key={city.id}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${
                          index === selectedIndex ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                        }`}
                        onClick={() => handleCitySelect(cityName)}
                      >
                        <div className="font-medium">{city.city_name}</div>
                        <div className="text-xs text-gray-500">
                          {city.state_province ? `${city.state_province}, ` : ""}{city.country}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">No cities found</div>
                )}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-1">
              Start typing to search our city database and select your city.
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