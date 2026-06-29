import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { JuiceIcon, MilkIcon } from "@/components/icons/BrandVoteIcons";
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
  const [ack, setAck] = useState(false);

  // City — where this happened, so stories are findable/filterable by city. DB cities with a
  // free-text fallback for anywhere not in the list. Optional.
  const [cityQuery, setCityQuery] = useState(storyData.metadata.location ?? "");
  const [cityOpen, setCityOpen] = useState(false);
  const { data: cityResults = [] } = useCities(cityQuery);
  const typedCity = cityQuery.trim();
  const showCityFreeText =
    typedCity.length >= 2 && !cityResults.some((c) => c.city_name.toLowerCase() === typedCity.toLowerCase());
  const pickCity = (name: string, id: string | null) => {
    setCityQuery(name);
    setCityOpen(false);
    setStoryData((prev) => ({ ...prev, metadata: { ...prev.metadata, city_id: id, location: name } }));
  };
  const clearCity = () => {
    setCityQuery("");
    setStoryData((prev) => ({ ...prev, metadata: { ...prev.metadata, city_id: null, location: "" } }));
  };

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
        <h3 className="text-lg font-semibold mb-1">City <span className="text-xs font-normal text-muted-foreground">(optional)</span></h3>
        <p className="text-xs text-muted-foreground mb-2">Where it happened — helps others find stories by city.</p>
        <div className="relative">
          <input
            id="story-city"
            value={cityQuery}
            onChange={(e) => { setCityQuery(e.target.value); setCityOpen(true); }}
            onFocus={() => setCityOpen(true)}
            onBlur={() => window.setTimeout(() => setCityOpen(false), 150)}
            placeholder="Search a city"
            autoComplete="off"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          {cityQuery && (
            <button
              type="button"
              onClick={clearCity}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
          {cityOpen && (cityResults.length > 0 || showCityFreeText) && (
            <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-background shadow-lg">
              {cityResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCity(c.state_province ? `${c.city_name}, ${c.state_province}` : c.city_name, c.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    {c.city_name}
                    {c.state_province && <span className="text-muted-foreground">, {c.state_province}</span>}
                  </span>
                </button>
              ))}
              {showCityFreeText && (
                <button
                  type="button"
                  onClick={() => pickCity(typedCity, null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted border-t border-border"
                >
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>Use “<span className="font-medium">{typedCity}</span>”</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-1">Your verdict</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Overall — did she have the juice, or spoiled milk? (optional)
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
            <JuiceIcon className="h-5 w-5" />
            Juice
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
            <MilkIcon className="h-5 w-5" />
            Milk
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