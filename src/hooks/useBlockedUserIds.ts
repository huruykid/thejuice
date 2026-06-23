import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the list of user IDs the current user has blocked.
 * Used to filter blocked users out of feed queries client-side.
 * Returns an empty array when not authenticated.
 */
export const useBlockedUserIds = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked-user-ids", user?.id],
    queryFn: async (): Promise<string[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id);
      if (error) throw error;
      return (data ?? []).map((row) => row.blocked_id);
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};