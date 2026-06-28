import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [ack, setAck] = useState(false);
  const verdict = storyData.ratings.vibe || 0;
  const setVerdict = (v: number) =>
    setStoryData((prev) => ({
      ...prev,
      ratings: { ...prev.ratings, vibe: prev.ratings.vibe === v ? 0 : v },
    }));
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
        <h3 className="text-lg font-semibold mb-1">Your verdict</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Overall — is she a green flag or a red flag? (optional)
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setVerdict(1)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all active:scale-95",
              verdict > 0
                ? "bg-success/15 border-success text-success"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <CheckCircle2 className="h-5 w-5" fill={verdict > 0 ? "currentColor" : "none"} />
            Green flag
          </button>
          <button
            type="button"
            onClick={() => setVerdict(-1)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all active:scale-95",
              verdict < 0
                ? "bg-destructive/15 border-destructive text-destructive"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Flag className="h-5 w-5" fill={verdict < 0 ? "currentColor" : "none"} />
            Red flag
          </button>
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