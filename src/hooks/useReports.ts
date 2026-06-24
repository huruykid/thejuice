import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

/**
 * Returns whether the current user has already reported a given (type, id) pair.
 * Used to disable the report button and prevent duplicates.
 */
export const useHasReported = (targetType: string, targetId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['has-reported', targetType, targetId, user?.id],
    enabled: !!user && !!targetId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', user!.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
};

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'story' | 'comment' | 'user';
  target_id: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewing' | 'action_taken' | 'dismissed';
  created_at: string;
  updated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  action_taken?: string;
}

export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async (): Promise<Report[]> => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Report[];
    },
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      reason,
      details
    }: {
      targetType: 'story' | 'comment' | 'user';
      targetId: string;
      reason: string;
      details?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated');

      // Prevent duplicate reports server-side via unique constraint, but also
      // guard client-side to give a nicer UX before the round-trip.
      const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('reporter_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle();

      if (existing) {
        throw new Error('already_reported');
      }

      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason,
          details
        });

      if (error) throw error;
      return { targetType, targetId, userId: user.id };
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['has-reported', vars.targetType, vars.targetId] });
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe. We'll review this within 24 hours.",
      });
    },
    onError: (error: any) => {
      if (error?.message === 'already_reported') {
        toast({
          title: "Already reported",
          description: "You've already reported this content.",
          variant: "destructive"
        });
        return;
      }
      console.error('Report creation error:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    },
  });
};