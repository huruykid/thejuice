import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InviteCode {
  id: string;
  code: string;
  created_at: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null;
}

export interface InviteStats {
  invites_remaining: number;
  invites_sent: number;
  invites_used: number;
}

export const useInvites = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's invite stats
  const { data: inviteStats, isLoading: statsLoading } = useQuery({
    queryKey: ['invite-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_invite_stats')
        .select('invites_remaining, invites_sent, invites_used')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as InviteStats;
    },
  });

  // Get user's invite codes
  const { data: inviteCodes, isLoading: codesLoading } = useQuery({
    queryKey: ['invite-codes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('invite_codes')
        .select('id, code, created_at, expires_at, used_by, used_at')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InviteCode[];
    },
  });

  // Generate new invite code
  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      // Server-side function performs rate limit, quota check, code generation,
      // insert, and stats decrement atomically.
      const { data, error } = await supabase
        .rpc('generate_user_invite_code');

      if (error) throw error;
      return data as string;
    },
    onSuccess: (code) => {
      toast({
        title: "Invite code generated!",
        description: `Your invite code: ${code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['invite-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invite-codes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate invite",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Validate invite code (for signup)
  const validateInviteCode = async (code: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('validate_invite_code', { code_param: code });
      return !error && data === true;
    } catch {
      return false;
    }
  };

  return {
    inviteStats,
    inviteCodes,
    statsLoading,
    codesLoading,
    generateInvite: generateInviteMutation.mutate,
    generatingInvite: generateInviteMutation.isPending,
    validateInviteCode
  };
};