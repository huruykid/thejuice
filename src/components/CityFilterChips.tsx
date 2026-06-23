import { MapPin, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import CitySheet from "@/components/CitySheet";

export type FeedScope = "all" | "city";

interface Props {
  scope: FeedScope;
  onScopeChange: (scope: FeedScope) => void;
  cityId: string | null | undefined;
}

/**
 * Twitter/Reddit-style filter chips that sit above the feed.
 * "All" = global feed, "[City] ▾" = posts tagged to the user's saved city.
 * Tapping the city chip when no city is set opens the city picker first.
 */
const CityFilterChips = ({ scope, onScopeChange, cityId }: Props) => {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const profileCityId =
    cityId ?? ((profile as any)?.city_id as string | null | undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: city } = useQuery({
    queryKey: ["city", profileCityId],
    enabled: !!profileCityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, city_name, state_province")
        .eq("id", profileCityId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleCityClick = () => {
    if (!profileCityId) {
      setPickerOpen(true);
      return;
    }
    onScopeChange("city");
  };

  const cityLabel = city?.city_name || "Pick a city";

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onScopeChange("all")}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            scope === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-card-hover"
          }`}
        >
          All
        </button>
        <button
          onClick={handleCityClick}
          className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            scope === "city" && profileCityId
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-card-hover"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          {cityLabel}
          <ChevronDown
            className="h-3 w-3 opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              setPickerOpen(true);
            }}
          />
        </button>
        {scope === "city" && profileCityId && (
          <button
            onClick={() => setPickerOpen(true)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            Change
          </button>
        )}
      </div>

      <CitySheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentCityId={profileCityId}
        onSelect={() => onScopeChange("city")}
      />
    </>
  );
};

export default CityFilterChips;