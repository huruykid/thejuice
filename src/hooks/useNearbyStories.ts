import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance, type Coordinates } from "@/lib/distance";
import { useBlockedUserIds } from "./useBlockedUserIds";
import type { Story } from "./useStories";

export type StoryWithDistance = Story & {
  distance: number | null;
  cities?: { city_name: string; state_province: string; latitude?: number | null; longitude?: number | null } | null;
};

/**
 * Fetches ALL approved community stories and sorts them closest-first.
 * Stories without city coordinates sort to the end.
 *
 * Intentionally non-paginated — fine for a small catalogue. When posts reach
 * the thousands, replace with a Supabase RPC using PostGIS ordering.
 */
export const useNearbyStories = (
  userLocation: Coordinates | null,
  enabled = true
) => {
  const { data: blockedIds = [] } = useBlockedUserIds();

  return useQuery({
    queryKey: [
      "nearby-stories",
      userLocation?.latitude,
      userLocation?.longitude,
      { blocked: blockedIds },
    ],
    enabled: enabled && !!userLocation,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<StoryWithDistance[]> => {
      let query = (supabase as any)
        .from("stories")
        .select(`
          *,
          profiles:user_id (id, anonymous_username),
          story_tags (tag),
          cities:city_id (city_name, state_province, latitude, longitude)
        `)
        .eq("status", "approved")
        .eq("is_seed", false)
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });

      if (blockedIds.length > 0) {
        query = query.not("user_id", "in", `(${blockedIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? [])
        .map((story: any): StoryWithDistance => {
          const lat = story.cities?.latitude;
          const lng = story.cities?.longitude;
          const distance =
            lat != null && lng != null && userLocation
              ? calculateDistance(userLocation, {
                  latitude: Number(lat),
                  longitude: Number(lng),
                })
              : null;
          return { ...story, distance };
        })
        .sort((a: StoryWithDistance, b: StoryWithDistance) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
    },
  });
};
