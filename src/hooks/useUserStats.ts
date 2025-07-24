import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserStats {
  storiesPosted: number;
  totalLikes: number;
  commentsReceived: number;
  memberSince: string;
}

export const useUserStats = () => {
  const { user } = useAuth();

  const { data: userStats, isLoading, error } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // Get user's stories count
      const { count: storiesCount, error: storiesError } = await (supabase as any)
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (storiesError) throw storiesError;

      // Get total likes on user's stories
      const { data: likesData, error: likesError } = await (supabase as any)
        .from('reactions')
        .select('*, stories!inner(user_id)')
        .eq('stories.user_id', user.id);

      if (likesError) throw likesError;

      // Get comments received on user's stories
      const { count: commentsCount, error: commentsError } = await (supabase as any)
        .from('comments')
        .select('*, stories!inner(user_id)', { count: 'exact', head: true })
        .eq('stories.user_id', user.id);

      if (commentsError) throw commentsError;

      // Format member since date
      const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      const stats: UserStats = {
        storiesPosted: storiesCount || 0,
        totalLikes: likesData?.length || 0,
        commentsReceived: commentsCount || 0,
        memberSince
      };

      return stats;
    },
    enabled: !!user,
  });

  return {
    userStats: userStats || {
      storiesPosted: 0,
      totalLikes: 0,
      commentsReceived: 0,
      memberSince: user ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      }) : 'Unknown'
    },
    isLoading,
    error
  };
};