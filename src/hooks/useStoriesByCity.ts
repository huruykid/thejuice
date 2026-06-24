import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Story } from "./useStories";
import { useBlockedUserIds } from "./useBlockedUserIds";

const PAGE_SIZE = 10;

export const useStoriesByCity = (cityId: string | null | undefined) => {
  const { data: blockedIds = [] } = useBlockedUserIds();
  return useInfiniteQuery({
    queryKey: ["stories", "by-city", cityId, { blocked: blockedIds }],
    enabled: !!cityId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = (supabase as any)
        .from("stories")
        .select(
          `*,
           profiles:user_id (anonymous_username),
           story_tags (tag),
           cities:city_id (city_name, state_province)`
        )
        .eq("city_id", cityId!)
        .eq("status", "approved")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (blockedIds.length > 0) {
        query = query.not("user_id", "in", `(${blockedIds.join(",")})`);
      }
      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as unknown as Story[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
  });
};