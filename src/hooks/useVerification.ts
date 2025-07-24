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

  // Get user's verification status
  const { data: verification, isLoading, error } = useQuery({
    queryKey: ['user-verification', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserVerification | null;
    },
    enabled: !!userId,
  });

  // Create verification record
  const createVerification = useMutation({
    mutationFn: async (data: {
      user_id: string;
      selfie_url: string;
      verification_status?: string;
    }) => {
      const { error } = await supabase
        .from('user_verifications')
        .insert(data);

      if (error) throw error;
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