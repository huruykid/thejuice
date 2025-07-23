import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTrendingStories = () => {
  return useQuery({
    queryKey: ["trending-stories"],
    queryFn: async () => {
      // Get stories from last 48 hours, sorted by engagement
      const twoDaysAgo = new Date();
      twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

      const { data, error } = await supabase
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
        `)
        .gte('created_at', twoDaysAgo.toISOString())
        .order('reactions_count', { ascending: false })
        .order('comments_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
  });
};