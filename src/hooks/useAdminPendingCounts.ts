import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminPendingCounts = (enabled: boolean) => {
  return useQuery({
    queryKey: ["admin-pending-counts"],
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [verifications, posts, reports] = await Promise.all([
        supabase
          .from("user_verifications")
          .select("id", { count: "exact", head: true })
          .eq("verification_status", "pending"),
        supabase
          .from("stories")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("is_seed", false),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        verifications: verifications.count ?? 0,
        posts: posts.count ?? 0,
        reports: reports.count ?? 0,
      };
    },
  });
};