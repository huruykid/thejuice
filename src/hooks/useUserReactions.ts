import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserReactionState {
  isRedFlagged: boolean;
  isGreenFlagged: boolean;
}

export const userReactionsKey = (storyId: string, userId: string | undefined) =>
  ['user-reactions', storyId, userId] as const;

export const useUserReactions = (
  storyId: string,
  userId: string | undefined
): UserReactionState => {
  const { data } = useQuery({
    queryKey: userReactionsKey(storyId, userId),
    queryFn: async (): Promise<UserReactionState> => {
      if (!userId) return { isRedFlagged: false, isGreenFlagged: false };

      const { data: reactions, error } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('story_id', storyId)
        .eq('user_id', userId);

      if (error) throw error;

      const types = reactions?.map((r) => r.reaction_type) ?? [];
      return {
        isRedFlagged: types.includes('red_flag'),
        isGreenFlagged: types.includes('green_flag'),
      };
    },
    enabled: !!storyId,
    staleTime: 30_000, // treat as fresh for 30s — avoids re-fetching on every re-render
  });

  return data ?? { isRedFlagged: false, isGreenFlagged: false };
};

/** Optimistically update the cached reaction state without waiting for a refetch. */
export const useSetUserReactions = (storyId: string, userId: string | undefined) => {
  const queryClient = useQueryClient();

  return (patch: Partial<UserReactionState>) => {
    queryClient.setQueryData<UserReactionState>(
      userReactionsKey(storyId, userId),
      (prev) => ({ ...(prev ?? { isRedFlagged: false, isGreenFlagged: false }), ...patch })
    );
  };
};
