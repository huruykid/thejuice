import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendStoryEventNotification } from '@/lib/sendPushNotification';

export const useToggleReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, reactionType = 'like' }: { storyId: string; reactionType?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Fetch story owner for push notification
      const { data: storyMeta } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .maybeSingle();

      // Check if user has ANY reaction to this story (to enforce one vote per user)
      const { data: existingReactions, error: checkError } = await supabase
        .from('reactions')
        .select('id, reaction_type')
        .eq('story_id', storyId)
        .eq('user_id', user.id);

      if (checkError) throw checkError;

      const existingReaction = existingReactions?.find(r => r.reaction_type === reactionType);
      const otherReaction = existingReactions?.find(r => r.reaction_type !== reactionType);

      if (existingReaction) {
        // User clicked the same reaction they already have - remove it
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
        // reactions_count is maintained atomically by the DB trigger (sync_story_reactions_count).

        return { action: 'removed', removedType: reactionType, reactorUserId: user.id, storyOwnerId: storyMeta?.user_id ?? null };
      } else {
        // User wants to add a new reaction
        if (otherReaction) {
          // User already has the opposite reaction - replace it (no count change)
          const { error: deleteError } = await supabase
            .from('reactions')
            .delete()
            .eq('id', otherReaction.id);

          if (deleteError) throw deleteError;
        }

        // Add the new reaction. Upsert on the (story_id, user_id) unique constraint so a
        // concurrent double-tap settles on a single row instead of erroring or duplicating.
        const { error } = await supabase
          .from('reactions')
          .upsert({
            story_id: storyId,
            user_id: user.id,
            reaction_type: reactionType,
          }, { onConflict: 'story_id,user_id' });

        if (error) throw error;
        // reactions_count is maintained atomically by the DB trigger; a delete+insert
        // (the "replace" case) nets zero because the trigger recomputes from the rows.

        return { action: 'added', addedType: reactionType, replacedType: otherReaction?.reaction_type, reactorUserId: user.id, storyOwnerId: storyMeta?.user_id ?? null };
      }
    },
    onSuccess: (data, { storyId }) => {
      if (
        data.action === 'added' &&
        data.storyOwnerId &&
        data.reactorUserId !== data.storyOwnerId
      ) {
        sendStoryEventNotification('reaction', storyId).catch(console.error);
      }
    },
    onMutate: async ({ storyId, reactionType = 'like' }) => {
      // Optimistically update the per-story reaction counts cache so the
      // count bumps instantly while the network request is in flight.
      const key = ['reaction-counts', storyId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ red_flag: number; green_flag: number }>(key);
      if (previous) {
        const next = { ...previous };
        const opposite = reactionType === 'red_flag' ? 'green_flag' : 'red_flag';
        // We don't know yet if this is add/remove/replace, but the optimistic
        // bump matches the most common case (toggling on). onSettled reconciles.
        if (reactionType === 'red_flag' || reactionType === 'green_flag') {
          (next as any)[reactionType] = Math.max(0, (next as any)[reactionType] + 1);
          if ((previous as any)[opposite] > 0) {
            (next as any)[opposite] = Math.max(0, (next as any)[opposite] - 1);
          }
        }
        queryClient.setQueryData(key, next);
      }
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && context?.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { storyId, reactionType = 'like' }) => {
      queryClient.invalidateQueries({ queryKey: ['reaction-counts', storyId] });
      // Invalidate the per-user reaction state so the flag button reflects reality.
      queryClient.invalidateQueries({ queryKey: ['user-reactions', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['search-stories'] });
      queryClient.invalidateQueries({ queryKey: ['trending-stories'] });
    },
  });
};