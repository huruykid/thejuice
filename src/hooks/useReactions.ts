import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useToggleReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, reactionType = 'like' }: { storyId: string; reactionType?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Check if user already reacted to this story
      const { data: existingReaction, error: checkError } = await supabase
        .from('reactions')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingReaction) {
        // Remove reaction if it exists
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

        return { action: 'removed' };
      } else {
        // Add reaction if it doesn't exist
        const { error } = await supabase
          .from('reactions')
          .insert({
            story_id: storyId,
            user_id: user.id,
            reaction_type: reactionType,
          });

        if (error) throw error;

        // Increment reactions count
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

        return { action: 'added' };
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