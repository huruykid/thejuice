import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useToggleReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, reactionType = 'like' }: { storyId: string; reactionType?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

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

        // Decrement reactions count
        const { data: currentStory } = await supabase
          .from('stories')
          .select('reactions_count')
          .eq('id', storyId)
          .single();

        if (currentStory) {
          const { error: updateError } = await supabase
            .from('stories')
            .update({ reactions_count: Math.max(0, currentStory.reactions_count - 1) })
            .eq('id', storyId);

          if (updateError) throw updateError;
        }

        return { action: 'removed', removedType: reactionType };
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

        // Add the new reaction
        const { error } = await supabase
          .from('reactions')
          .insert({
            story_id: storyId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;

        // Only increment count if user didn't have any previous reaction
        if (!otherReaction) {
          const { data: currentStory } = await supabase
            .from('stories')
            .select('reactions_count')
            .eq('id', storyId)
            .single();

          if (currentStory) {
            const { error: updateError } = await supabase
              .from('stories')
              .update({ reactions_count: currentStory.reactions_count + 1 })
              .eq('id', storyId);

            if (updateError) throw updateError;
          }
        }

        return { action: 'added', addedType: reactionType, replacedType: otherReaction?.reaction_type };
      }
    },
    onSuccess: () => {
      // Invalidate and refetch stories data
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['search-stories'] });
      queryClient.invalidateQueries({ queryKey: ['trending-stories'] });
    },
  });
};