import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Story } from "@/hooks/useStories";

// ─── Query keys ──────────────────────────────────────────────────────────────

const bookmarkKey  = (userId: string, storyId: string) => ["bookmark", userId, storyId];
const bookmarksKey = (userId: string)                  => ["bookmarks", userId];

// ─── Is a specific story bookmarked? ─────────────────────────────────────────

export const useIsBookmarked = (storyId: string, userId?: string) => {
  return useQuery({
    queryKey: bookmarkKey(userId ?? "", storyId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", userId!)
        .eq("story_id", storyId)
        .maybeSingle();
      return !!data;
    },
  });
};

// ─── Toggle bookmark (add / remove) ──────────────────────────────────────────

export const useToggleBookmark = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      storyId,
      userId,
      isCurrentlyBookmarked,
    }: {
      storyId: string;
      userId: string;
      isCurrentlyBookmarked: boolean;
    }) => {
      if (isCurrentlyBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", userId)
          .eq("story_id", storyId);
        if (error) throw error;
        return false;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: userId, story_id: storyId });
        if (error) throw error;
        return true;
      }
    },
    onMutate: async ({ storyId, userId, isCurrentlyBookmarked }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: bookmarkKey(userId, storyId) });
      const prev = qc.getQueryData<boolean>(bookmarkKey(userId, storyId));
      qc.setQueryData(bookmarkKey(userId, storyId), !isCurrentlyBookmarked);
      return { prev };
    },
    onError: (_err, { storyId, userId }, ctx) => {
      // Roll back
      if (ctx?.prev !== undefined) {
        qc.setQueryData(bookmarkKey(userId, storyId), ctx.prev);
      }
    },
    onSettled: (_data, _err, { storyId, userId }) => {
      qc.invalidateQueries({ queryKey: bookmarkKey(userId, storyId) });
      qc.invalidateQueries({ queryKey: bookmarksKey(userId) });
    },
  });
};

// ─── All bookmarked stories for a user ───────────────────────────────────────

export const useBookmarkedStories = (userId?: string) => {
  return useQuery({
    queryKey: bookmarksKey(userId ?? ""),
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookmarks")
        .select(`
          story_id,
          created_at,
          stories (
            id, content, subject_name, created_at, status,
            user_id, profile_id, image_url, location,
            communication_rating, loyalty_rating,
            overall_vibe_rating, emotional_safety_rating,
            comments_count, submitted_anonymously, is_seed,
            story_tags (tag),
            profiles (anonymous_username)
          )
        `)
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? [])
        .map((row: any) => row.stories as Story & { profiles?: { anonymous_username: string } })
        .filter(Boolean);
    },
  });
};
