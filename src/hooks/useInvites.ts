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

      const { data, error } = await (supabase as any)
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

      const { data, error } = await (supabase as any)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check rate limiting first
      const { data: rateLimitOk, error: rateLimitError } = await (supabase as any)
        .rpc('check_invite_generation_rate_limit', { user_id_param: user.id });

      if (rateLimitError) throw rateLimitError;
      if (!rateLimitOk) {
        throw new Error('Rate limit exceeded. You can only generate 5 invite codes per hour.');
      }

      // Check if user has remaining invites
      if (inviteStats && inviteStats.invites_remaining <= 0) {
        throw new Error('No invites remaining');
      }

      // Generate invite code
      const { data: codeData, error: codeError } = await (supabase as any)
        .rpc('generate_invite_code');

      if (codeError) throw codeError;

      // Insert the invite code
      const { error: insertError } = await (supabase as any)
        .from('invite_codes')
        .insert({
          code: codeData,
          created_by: user.id
        });

      if (insertError) throw insertError;

      // Update user's invite stats
      const { error: updateError } = await (supabase as any)
        .from('user_invite_stats')
        .update({
          invites_remaining: inviteStats!.invites_remaining - 1,
          invites_sent: inviteStats!.invites_sent + 1
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      return codeData;
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
      const { data, error } = await (supabase as any)
        .from('invite_codes')
        .select('id')
        .eq('code', code.toUpperCase())
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      return !error && !!data;
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