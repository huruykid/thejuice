import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { rateLimiter } from '@/lib/security';
import { useSecurityEventLogger } from './useSecurityAudit';

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
  const { logVerificationSubmission, logSuspiciousActivity } = useSecurityEventLogger();

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
      // Rate limiting check - max 3 verification attempts per hour
      const rateLimitKey = `verification:${data.user_id}`;
      if (!rateLimiter.isAllowed(rateLimitKey, 3, 60 * 60 * 1000)) {
        const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey, 60 * 60 * 1000);
        const minutesLeft = Math.ceil(timeUntilReset / (60 * 1000));
        
        logSuspiciousActivity('verification_rate_limit_exceeded', {
          user_id: data.user_id,
          minutes_until_reset: minutesLeft
        });
        
        throw new Error(`Too many verification attempts. Please wait ${minutesLeft} minutes before trying again.`);
      }

      // Check if user is admin by looking at their roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user_id)
        .eq('role', 'admin')
        .maybeSingle();

      // Auto-approve admin accounts
      const isAdmin = !!userRoles;
      const finalStatus = isAdmin ? 'approved' : (data.verification_status || 'pending');

      // Check if verification already exists
      const { data: existing } = await supabase
        .from('user_verifications')
        .select('id')
        .eq('user_id', data.user_id)
        .maybeSingle();

      let verificationId: string;

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
        verificationId = existing.id;
      } else {
        // Create new verification
        const { data: newVerification, error } = await supabase
          .from('user_verifications')
          .insert({
            ...data,
            verification_status: finalStatus
          })
          .select('id')
          .single();

        if (error) throw error;
        verificationId = newVerification.id;
      }

      // Log the verification submission
      logVerificationSubmission(verificationId);

      return verificationId;
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