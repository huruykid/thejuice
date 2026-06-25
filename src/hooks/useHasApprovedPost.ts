import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns true when the user has at least one approved, non-seed,
 * non-anonymous post. Drives the post-to-unlock feed gate.
 */
export const useHasApprovedPost = (userId?: string) => {
  return useQuery({
    queryKey: ["has-approved-post", userId],
    enabled: !!userId,
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "approved")
        .eq("is_seed", false)
        .eq("submitted_anonymously", false);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    staleTime: 30_000,
  });
};