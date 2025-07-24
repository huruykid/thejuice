
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
          profiles (
            id,
            anonymous_username
          ),
          story_tags (
            tag
          )
        `);

      // Add text search
      if (query.trim()) {
        dbQuery = dbQuery.or(`content.ilike.%${query}%,profiles.anonymous_username.ilike.%${query}%`);
      }

      // Add location filter with partial matching
      if (location && location.trim()) {
        dbQuery = dbQuery.ilike('location', `%${location.trim()}%`);
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
