import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StoryData } from "./index";

interface FlagsStepProps {
  storyData: StoryData;
  setStoryData: (updater: (prev: StoryData) => StoryData) => void;
  onNext: () => void;
  onBack: () => void;
}

const FlagsStep = ({
  storyData,
  setStoryData,
  onNext,
  onBack
}: FlagsStepProps) => {
  const greenFlags = [
    "💯Loyal", "✨Thoughtful", "🔥Chemistry", "🎵Music Lover", "🍕Foodie", 
    "💼Career Focused", "🏃‍♂️Active", "🎨Creative", "😂Funny", "🧠Smart",
    "💝Generous", "🤗Respectful", "📞Good Communicator"
  ];

  const redFlags = [
    "🚩Red Flag", "🫠Ghosted", "💸Gold Digger", "📱Phone Addict", 
    "🤷‍♀️Mixed Signals", "🎭Fake", "❄️Cold", "🙄Rude", "⏰Always Late",
    "🍻Heavy Drinker", "🤥Dishonest", "😠Aggressive"
  ];

  const toggleTag = (tag: string) => {
    setStoryData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag) 
        ? prev.selectedTags.filter(t => t !== tag) 
        : [...prev.selectedTags, tag]
    }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Red Flags & Green Flags</h3>
        <p className="text-sm text-gray-600 mb-4">Select any flags that apply to this person</p>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-green-700 mb-2">Green Flags ✅</h4>
            <div className="flex flex-wrap gap-2">
              {greenFlags.map((flag) => (
                <Badge
                  key={flag}
                  variant={storyData.selectedTags.includes(flag) ? "default" : "outline"}
                  className="cursor-pointer border-green-200 hover:border-green-300"
                  onClick={() => toggleTag(flag)}
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-red-700 mb-2">Red Flags 🚩</h4>
            <div className="flex flex-wrap gap-2">
              {redFlags.map((flag) => (
                <Badge
                  key={flag}
                  variant={storyData.selectedTags.includes(flag) ? "default" : "outline"}
                  className="cursor-pointer border-red-200 hover:border-red-300"
                  onClick={() => toggleTag(flag)}
                >
                  {flag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default FlagsStep;