import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApproveUserData {
  userId: string;
  email: string;
  username?: string;
  notes?: string;
}

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, email, username, notes }: ApproveUserData) => {
      // Update verification status to approved
      const { error: updateError } = await supabase
        .from('user_verifications')
        .update({ 
          verification_status: 'approved',
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error(`Failed to update verification: ${updateError.message}`);
      }

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: { 
          email, 
          username 
        }
      });

      if (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't throw here - approval succeeded even if email failed
        toast({
          title: "User Approved",
          description: "User approved successfully, but approval email failed to send.",
          variant: "default",
        });
      } else {
        toast({
          title: "✅ User Approved",
          description: "User approved and welcome email sent successfully!",
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate verification queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['user-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};