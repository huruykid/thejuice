import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateDistance, type Coordinates } from "@/lib/distance";
import type { Story } from "./useStories";

export interface NearbyStoriesOptions {
  userLocation: Coordinates;
  radiusMiles?: number;
  enabled?: boolean;
}

export const useNearbyStories = ({ 
  userLocation, 
  radiusMiles = 25, 
  enabled = true 
}: NearbyStoriesOptions) => {
  return useQuery({
    queryKey: ["nearby-stories", userLocation.latitude, userLocation.longitude, radiusMiles],
    queryFn: async () => {
      const { data: stories, error } = await supabase
        .from("stories")
        .select(`
          *,
          profiles (
            id,
            anonymous_username
          ),
          cities (
            id,
            city_name,
            state_province,
            latitude,
            longitude
          ),
          story_tags (
            tag
          )
        `)
        .not('cities', 'is', null) // Only get stories with city data
        .eq('status', 'approved')
        .not('image_url', 'is', null)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Filter and sort by distance on the client side
      const storiesWithDistance = (stories || [])
        .map((story) => {
          if (!story.cities?.latitude || !story.cities?.longitude) {
            return null;
          }

          const distance = calculateDistance(
            userLocation,
            {
              latitude: Number(story.cities.latitude),
              longitude: Number(story.cities.longitude),
            }
          );

          return {
            ...story,
            distance,
          };
        })
        .filter((story): story is NonNullable<typeof story> => 
          story !== null && story.distance <= radiusMiles
        )
        .sort((a, b) => a.distance - b.distance);

      return storiesWithDistance;
    },
    enabled: enabled && !!userLocation.latitude && !!userLocation.longitude,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};