import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendStoryEventNotification } from '@/lib/sendPushNotification';

export interface Comment {
  id: string;
  content: string;
  story_id: string;
  user_id?: string;
  created_at: string;
  profiles?: {
    id: string;
    anonymous_username: string;
  } | null;
}

export const useComments = (storyId: string) => {
  return useQuery({
    queryKey: ['comments', storyId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles:profile_id(id, anonymous_username)')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storyId, content }: { storyId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Fetch the profile id for this user so the FK join works
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('comments')
        .insert({
          story_id: storyId,
          content,
          user_id: user.id,
          profile_id: profileRow?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      // comments_count is maintained atomically by the DB trigger (sync_story_comments_count).
      // Still fetch the story owner for the push notification.
      const { data: currentStory } = await supabase
        .from('stories')
        .select('user_id')
        .eq('id', storyId)
        .maybeSingle();

      return { ...data, commenterUserId: user.id, storyOwnerId: currentStory?.user_id ?? null };
    },
    onSuccess: (data, variables) => {
      if (
        data.storyOwnerId &&
        data.commenterUserId !== data.storyOwnerId
      ) {
        sendStoryEventNotification('comment', variables.storyId).catch(console.error);
      }
      queryClient.invalidateQueries({ queryKey: ['comments', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['search-stories'] });
      queryClient.invalidateQueries({ queryKey: ['trending-stories'] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, storyId }: { commentId: string; storyId: string }) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      // comments_count is maintained atomically by the DB trigger.
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['search-stories'] });
      queryClient.invalidateQueries({ queryKey: ['trending-stories'] });
    },
  });
};