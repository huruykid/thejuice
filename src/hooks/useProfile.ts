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

      const { data, error } = await supabase
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
    try {
      // First try the RPC function
      const { data, error } = await supabase
        .rpc('is_username_available', { username });
      
      if (error) {
        console.warn('RPC function failed, falling back to direct query:', error);
        // Fallback to direct database query
        const { data: existingProfile, error: queryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('anonymous_username', username)
          .maybeSingle();
        
        if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Direct query also failed:', queryError);
          return false; // Conservative approach - assume not available if we can't check
        }
        
        // Username is available if no existing profile found
        return !existingProfile;
      }
      
      return data;
    } catch (error) {
      console.error('Username availability check failed:', error);
      return false; // Conservative approach - assume not available if we can't check
    }
  };

  return {
    profile,
    isLoading,
    error,
    hasProfile: !!profile,
    checkUsernameAvailability,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
  };
};