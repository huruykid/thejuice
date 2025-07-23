import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSearchStories = (query: string, location?: string, tag?: string) => {
  return useQuery({
    queryKey: ["search-stories", query, location, tag],
    queryFn: async () => {
      let dbQuery = supabase
        .from("stories")
        .select(`
          *,
          codenames (
            id,
            display_name,
            emoji,
            description
          ),
          story_tags (
            tag
          )
        `);

      // Add text search
      if (query.trim()) {
        dbQuery = dbQuery.or(`content.ilike.%${query}%,codenames.display_name.ilike.%${query}%`);
      }

      // Add location filter
      if (location) {
        dbQuery = dbQuery.eq('location', location);
      }

      // Add tag filter
      if (tag) {
        dbQuery = dbQuery.contains('story_tags.tag', [tag]);
      }

      const { data, error } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!(query.trim() || location || tag),
  });
};