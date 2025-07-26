
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
            anonymous_username,
            city,
            phone_number
          ),
          story_tags (
            tag
          )
        `);

      // Comprehensive text search across all fields
      if (query.trim()) {
        const searchTerm = `%${query.trim()}%`;
        dbQuery = dbQuery.or(`
          content.ilike.${searchTerm},
          location.ilike.${searchTerm},
          subject_name.ilike.${searchTerm},
          profiles.anonymous_username.ilike.${searchTerm},
          profiles.city.ilike.${searchTerm},
          profiles.phone_number.ilike.${searchTerm}
        `);
      }

      // Add location filter with partial matching (separate from main search)
      if (location && location.trim()) {
        dbQuery = dbQuery.ilike('location', `%${location.trim()}%`);
      }

      // Add tag filter by joining with story_tags
      if (tag) {
        const { data: taggedStoryIds } = await supabase
          .from('story_tags')
          .select('story_id')
          .ilike('tag', `%${tag}%`);
        
        if (taggedStoryIds && taggedStoryIds.length > 0) {
          const storyIds = taggedStoryIds.map(item => item.story_id);
          dbQuery = dbQuery.in('id', storyIds);
        } else {
          // No stories found with this tag, return empty result
          return [];
        }
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
