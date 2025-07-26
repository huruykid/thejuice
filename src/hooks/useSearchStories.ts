
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "./useDebounce";

export const useSearchStories = (query: string, location?: string, tag?: string) => {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery({
    queryKey: ["search-stories", debouncedQuery, location, tag],
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

      if (debouncedQuery.trim()) {
        const searchTerm = debouncedQuery.trim().toLowerCase();
        
        // Handle different search patterns
        const phoneSearchPatterns = [
          searchTerm,
          searchTerm.replace(/\D/g, ''), // Remove non-digits for phone search
          searchTerm.replace(/[()-\s+]/g, ''), // Remove phone formatting chars
        ].filter(Boolean);
        
        // Handle Instagram username search (with or without @)
        const instagramSearch = searchTerm.startsWith('@') ? searchTerm.substring(1) : searchTerm;
        
        // Build focused search conditions - Instagram and phone only
        const searchConditions = [
          // Instagram username variations
          `subject_name.ilike.%@${instagramSearch}%`,
          `content.ilike.%@${instagramSearch}%`,
        ];
        
        // Add phone number search patterns
        phoneSearchPatterns.forEach(pattern => {
          searchConditions.push(`subject_phone.ilike.%${pattern}%`);
          searchConditions.push(`profiles.phone_number.ilike.%${pattern}%`);
        });
        
        dbQuery = dbQuery.or(searchConditions.join(','));
      }

      // Handle tag-based search
      if (tag) {
        const { data: taggedStoryIds } = await supabase
          .from('story_tags')
          .select('story_id')
          .ilike('tag', `%${tag}%`);
        
        if (taggedStoryIds && taggedStoryIds.length > 0) {
          const storyIds = taggedStoryIds.map(item => item.story_id);
          dbQuery = dbQuery.in('id', storyIds);
        } else {
          return [];
        }
      }

      // Add location filter (separate from main search)
      if (location && location.trim()) {
        dbQuery = dbQuery.ilike('location', `%${location.trim()}%`);
      }

      const { data, error } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Search error:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!(debouncedQuery.trim() || location || tag),
  });
};
