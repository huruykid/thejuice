import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Persisted per-user preferences. Stored as a JSONB blob in
 * public.user_preferences keyed by user_id. Defaults are merged
 * client-side so we can add new keys without a migration.
 */
export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  communityUpdates: boolean;
  hideStoryFromSearch: boolean;
  blockOffensiveContent: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  communityUpdates: false,
  hideStoryFromSearch: false,
  blockOffensiveContent: true,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-preferences", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserPreferences> => {
      if (!user) return DEFAULT_PREFERENCES;
      const { data, error } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return { ...DEFAULT_PREFERENCES, ...(data?.preferences as Partial<UserPreferences> ?? {}) };
    },
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (patch: Partial<UserPreferences>) => {
      if (!user) throw new Error("Not authenticated");
      // Read current, merge, upsert. JSONB stays a single blob.
      const { data: existing } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      const merged = {
        ...DEFAULT_PREFERENCES,
        ...((existing?.preferences as Partial<UserPreferences>) ?? {}),
        ...patch,
      };
      const { error } = await supabase
        .from("user_preferences")
        .upsert({ user_id: user.id, preferences: merged }, { onConflict: "user_id" });
      if (error) throw error;
      return merged;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences", user?.id] });
    },
  });
};