import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { StoryData } from "./index";

interface StoryContentStepProps {
  storyData: StoryData;
  setStoryData: (updater: (prev: StoryData) => StoryData) => void;
  onNext: () => void;
  onBack: () => void;
}

const StoryContentStep = ({
  storyData,
  setStoryData,
  onNext,
  onBack
}: StoryContentStepProps) => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Share Your Experience</h3>
        <div className="space-y-4">
          <Textarea
            value={storyData.content}
            onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Share your dating experience... What happened? How did it make you feel?"
            className="min-h-[120px] resize-none"
            maxLength={5000}
          />
          <p className="text-xs text-muted-foreground">
            {storyData.content.length}/5000 characters
          </p>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={!storyData.content.trim()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default StoryContentStep;