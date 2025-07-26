import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user';

export const useUserRole = (userId?: string) => {
  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(r => r.role as UserRole) || [];
    },
    enabled: !!userId,
  });

  const hasRole = (role: UserRole): boolean => {
    return roles?.includes(role) || false;
  };

  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator');
  const isUser = hasRole('user');

  return {
    roles: roles || [],
    hasRole,
    isAdmin,
    isModerator,
    isUser,
    isLoading,
    error
  };
};