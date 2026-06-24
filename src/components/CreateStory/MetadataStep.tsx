import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { StoryData } from "./index";
import { FLAG_CATEGORIES, FlagRatingInput, type FlagValue } from "@/components/FlagRating";

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
  const [ack, setAck] = useState(false);
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
        <h3 className="text-lg font-semibold mb-1">Rate the experience</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Tap a green or red flag for each. Skip any you don't want to rate.
        </p>
        <div className="space-y-2">
          {FLAG_CATEGORIES.map((cat) => (
            <FlagRatingInput
              key={cat.key}
              category={cat}
              value={(storyData.ratings[cat.key] || 0) as FlagValue}
              onChange={(next) =>
                setStoryData((prev) => ({
                  ...prev,
                  ratings: { ...prev.ratings, [cat.key]: next },
                }))
              }
            />
          ))}
        </div>
      </div>

      <label className="flex gap-2 items-start text-xs text-muted-foreground cursor-pointer">
        <Checkbox
          checked={ack}
          onCheckedChange={(v) => setAck(Boolean(v))}
          className="mt-0.5"
        />
        <span>
          This is my real, alleged experience. I understand everything I post
          should be framed as <em>allegedly</em> what happened and I won't
          fabricate events, doctor photos, or share details I can't stand behind.
        </span>
      </label>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onPublish}
          disabled={isLoading || !ack}
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