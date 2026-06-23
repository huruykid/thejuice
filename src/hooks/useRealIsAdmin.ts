import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Direct admin check that bypasses the "View as" override. Use ONLY inside
 * ViewAsBar / admin tooling that needs to know the true role to decide
 * whether to render the toggle.
 */
export const useRealIsAdmin = (userId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["real-is-admin", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
  });
  return { isAdmin: !!data, isLoading };
};