import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTopTags = () => {
  return useQuery({
    queryKey: ["top-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("story_tags")
        .select("tag")
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count tag frequency
      const tagCounts: { [key: string]: number } = {};
      data?.forEach(({ tag }) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      // Convert to array and sort by count
      return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });
};