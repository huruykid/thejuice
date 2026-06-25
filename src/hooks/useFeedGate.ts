import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COMMUNITY_UNLOCK_THRESHOLD = 10;

/**
 * Determines whether a user should see the full community feed or the seed feed.
 *
 * Rules:
 * 1. If the community has published >= COMMUNITY_UNLOCK_THRESHOLD non-seed stories,
 *    everyone sees the community feed — there's enough content to stand on its own.
 * 2. Below that threshold, a user must have at least one approved post of their own
 *    to unlock the community feed (bootstrapping gate).
 *
 * Returns feedMode: "community" | "seed"
 */
export const useFeedGate = (userId?: string) => {
  const communityCount = useQuery({
    queryKey: ["community-post-count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .eq("is_seed", false);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const userPost = useQuery({
    queryKey: ["has-approved-post", userId],
    enabled: !!userId && (communityCount.data ?? 0) < COMMUNITY_UNLOCK_THRESHOLD,
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

  const isLoading = communityCount.isLoading || userPost.isLoading;

  const communityUnlocked =
    (communityCount.data ?? 0) >= COMMUNITY_UNLOCK_THRESHOLD;
  const userUnlocked = communityUnlocked || (userPost.data ?? false);

  const feedMode: "community" | "seed" = userUnlocked ? "community" : "seed";

  return { feedMode, isLoading };
};
