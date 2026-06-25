import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityItem {
  id: string;
  comment_content: string;
  commenter_username: string;
  story_id: string;
  story_content_preview: string;
  created_at: string;
  commenter_profile_id: string;
}

export const useUserActivity = () => {
  const { user } = useAuth();

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['user-activity', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get comments on the current user's stories
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          story_id,
          profile_id,
          stories!inner (
            user_id,
            content
          ),
          profiles (
            anonymous_username
          )
        `)
        .eq('stories.user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform the data into the expected format
      const activities: ActivityItem[] = data?.map((comment: any) => ({
        id: comment.id,
        comment_content: comment.content,
        commenter_username: comment.profiles?.anonymous_username || 'Anonymous',
        story_id: comment.story_id,
        story_content_preview: comment.stories.content.substring(0, 100) + (comment.stories.content.length > 100 ? '...' : ''),
        created_at: comment.created_at,
        commenter_profile_id: comment.profile_id
      })) || [];

      return activities;
    },
    enabled: !!user,
  });

  return {
    activities: activities || [],
    isLoading,
    error
  };
};