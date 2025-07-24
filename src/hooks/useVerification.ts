import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserVerification {
  id: string;
  user_id: string;
  selfie_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export const useVerification = (userId?: string) => {
  const queryClient = useQueryClient();

  // Get user's verification status (always get the most recent one)
  const { data: verification, isLoading, error } = useQuery({
    queryKey: ['user-verification', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data as UserVerification | null;
    },
    enabled: !!userId,
  });

  // Create verification record (only if none exists)
  const createVerification = useMutation({
    mutationFn: async (data: {
      user_id: string;
      selfie_url: string;
      verification_status?: string;
    }) => {
      // Check if user is admin by looking at their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('anonymous_username')
        .eq('user_id', data.user_id)
        .maybeSingle();

      // Auto-approve admin accounts
      const isAdmin = profile?.anonymous_username === 'admin';
      const finalStatus = isAdmin ? 'approved' : (data.verification_status || 'pending');

      // Check if verification already exists
      const { data: existing } = await supabase
        .from('user_verifications')
        .select('id')
        .eq('user_id', data.user_id)
        .maybeSingle();

      if (existing) {
        // Update existing verification instead of creating new one
        const { error } = await supabase
          .from('user_verifications')
          .update({
            selfie_url: data.selfie_url,
            verification_status: finalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', data.user_id);

        if (error) throw error;
      } else {
        // Create new verification
        const { error } = await supabase
          .from('user_verifications')
          .insert({
            ...data,
            verification_status: finalStatus
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-verification'] });
    },
  });

  const hasVerification = !!verification;
  const isVerified = verification?.verification_status === 'approved';
  const isPending = verification?.verification_status === 'pending';
  const isRejected = verification?.verification_status === 'rejected';

  return {
    verification,
    isLoading,
    error,
    hasVerification,
    isVerified,
    isPending,
    isRejected,
    createVerification,
  };
};