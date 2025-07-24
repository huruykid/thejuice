import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  anonymous_username: string;
  created_at: string;
}

export const useProfile = (user?: any) => {
  const queryClient = useQueryClient();

  // Get current user's profile - only when user exists
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user, // Only run when user exists
  });

  // Check if username is available
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    const { data, error } = await (supabase as any)
      .rpc('is_username_available', { username });
    
    if (error) throw error;
    return data;
  };

  return {
    profile,
    isLoading,
    error,
    hasProfile: !!profile,
    checkUsernameAvailability
  };
};