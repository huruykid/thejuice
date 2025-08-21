import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe. We'll review this within 24 hours.",
      });
    },
    onError: (error) => {
      console.error('Report creation error:', error);
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    },
  });
};