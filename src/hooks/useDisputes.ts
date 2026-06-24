import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DisputeRequest {
  id: string;
  story_id: string | null;
  subject_name: string;
  contact_email: string;
  reason: string;
  additional_info: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  // Joined story fields (may be null if story was deleted)
  story_content?: string | null;
  story_subject_name?: string | null;
}

export const useDisputes = () => {
  return useQuery({
    queryKey: ['disputes'],
    queryFn: async (): Promise<DisputeRequest[]> => {
      const { data, error } = await (supabase as any)
        .from('dispute_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const base = (data ?? []) as DisputeRequest[];

      // Batch-resolve story content for disputes that still have a story_id
      const storyIds = [...new Set(base.filter(d => d.story_id).map(d => d.story_id as string))];
      if (storyIds.length === 0) return base;

      const { data: stories } = await (supabase as any)
        .from('stories')
        .select('id, content, subject_name')
        .in('id', storyIds);

      const storyMap = Object.fromEntries(
        ((stories ?? []) as Array<{ id: string; content: string; subject_name: string | null }>)
          .map(s => [s.id, s])
      );

      return base.map(d => ({
        ...d,
        story_content: d.story_id ? (storyMap[d.story_id]?.content ?? null) : null,
        story_subject_name: d.story_id ? (storyMap[d.story_id]?.subject_name ?? null) : null,
      }));
    },
  });
};

export const useSubmitDispute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      story_id,
      subject_name,
      contact_email,
      reason,
      additional_info,
    }: {
      story_id?: string | null;
      subject_name: string;
      contact_email: string;
      reason: string;
      additional_info?: string;
    }) => {
      const { error } = await (supabase as any).from('dispute_requests').insert({
        story_id: story_id ?? null,
        subject_name,
        contact_email,
        reason,
        additional_info: additional_info ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
};

export const useResolveDispute = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      story_id,
      status,
      admin_notes,
    }: {
      id: string;
      story_id: string | null;
      status: 'approved' | 'rejected';
      admin_notes?: string;
    }) => {
      const { error } = await (supabase as any)
        .from('dispute_requests')
        .update({
          status,
          admin_notes: admin_notes ?? null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
        })
        .eq('id', id);
      if (error) throw error;

      // If approved and the story still exists, delete it
      if (status === 'approved' && story_id) {
        const { error: deleteError } = await (supabase as any)
          .from('stories')
          .delete()
          .eq('id', story_id);
        if (deleteError) throw deleteError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
    },
  });
};
