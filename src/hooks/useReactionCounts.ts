import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useReactionCounts = (storyId: string) => {
  return useQuery({
    queryKey: ["reaction-counts", storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("story_id", storyId);

      if (error) throw error;

      const counts = {
        red_flag: 0,
        green_flag: 0,
      };

      data?.forEach((reaction) => {
        if (reaction.reaction_type === "red_flag") {
          counts.red_flag++;
        } else if (reaction.reaction_type === "green_flag") {
          counts.green_flag++;
        }
      });

      return counts;
    },
    enabled: !!storyId,
  });
};