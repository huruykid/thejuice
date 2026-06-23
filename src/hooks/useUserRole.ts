import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useViewAs } from '@/contexts/ViewAsContext';

export type UserRole = 'admin' | 'moderator' | 'user';

export const useUserRole = (userId?: string) => {
  const { viewAs } = useViewAs();
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

  // Apply "View as" override: if a real admin is previewing another role,
  // strip the admin/moderator capabilities so the UI behaves like that role.
  const realIsAdmin = roles?.includes('admin') || false;
  const effectiveRoles: UserRole[] =
    realIsAdmin && viewAs
      ? viewAs === 'logged_out'
        ? []
        : ['user']
      : roles || [];

  const hasRole = (role: UserRole): boolean => {
    return effectiveRoles.includes(role);
  };

  const isAdmin = hasRole('admin');
  const isModerator = hasRole('moderator');
  const isUser = hasRole('user');

  return {
    roles: effectiveRoles,
    hasRole,
    isAdmin,
    isModerator,
    isUser,
    isLoading,
    error
  };
};