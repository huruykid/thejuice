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

      // Count only approved stories — matches what visitors can actually see.
      const { count: storiesCount, error: storiesError } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if (storiesError) throw storiesError;

      // Use count: exact + head: true so we never pull rows to the client.
      const { count: likesCount, error: likesError } = await supabase
        .from('reactions')
        .select('*, stories!inner(user_id)', { count: 'exact', head: true })
        .eq('stories.user_id', user.id);

      if (likesError) throw likesError;

      // Get comments received on user's approved stories only.
      const { count: commentsCount, error: commentsError } = await supabase
        .from('comments')
        .select('*, stories!inner(user_id, status)', { count: 'exact', head: true })
        .eq('stories.user_id', user.id)
        .eq('stories.status', 'approved');

      if (commentsError) throw commentsError;

      // Format member since date
      const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });

      const stats: UserStats = {
        storiesPosted: storiesCount || 0,
        totalLikes: likesCount || 0,
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