
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
        const searchTerm = query.trim();
        
        // Try different search patterns for phone numbers
        const phoneSearchPatterns = [
          searchTerm,
          searchTerm.replace(/\D/g, ''), // Remove non-digits
          searchTerm.replace(/[()-\s]/g, ''), // Remove common phone formatting
        ].filter(Boolean);
        
        // Build search conditions for all patterns
        const searchConditions = phoneSearchPatterns.map(pattern => 
          `content.ilike.%${pattern}%,location.ilike.%${pattern}%,subject_name.ilike.%${pattern}%,subject_phone.ilike.%${pattern}%,profiles.anonymous_username.ilike.%${pattern}%,profiles.city.ilike.%${pattern}%,profiles.phone_number.ilike.%${pattern}%`
        ).join(',');
        
        dbQuery = dbQuery.or(searchConditions);
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
