import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface City {
  id: string;
  city_name: string;
  slug: string;
  country: string;
  country_code: string;
  state_province: string;
  latitude?: number;
  longitude?: number;
  population?: number;
}

export const useCities = (searchQuery: string = "") => {
  return useQuery({
    queryKey: ["cities", searchQuery],
    queryFn: async () => {
      try {
        let query = supabase
          .from("cities")
          .select("*")
          .order("population", { ascending: false });

        if (searchQuery.trim()) {
          query = query.ilike("city_name", `%${searchQuery}%`);
        }

        const { data, error } = await query.limit(20);

        if (error) {
          console.error("Error fetching cities:", error);
          throw error;
        }

        return (data as City[]) || [];
      } catch (error) {
        console.error("Error in useCities:", error);
        return []; // Return empty array on error to prevent iteration issues
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useFindCityByName = (cityName: string) => {
  return useQuery({
    queryKey: ["city-by-name", cityName],
    queryFn: async () => {
      if (!cityName.trim()) return null;

      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .ilike("city_name", cityName)
        .single();

      if (error) {
        // Return null if no exact match found
        return null;
      }

      return data as City;
    },
    enabled: !!cityName.trim()
  });
};