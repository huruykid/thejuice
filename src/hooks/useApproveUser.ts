import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendVerificationApprovedNotification } from '@/lib/sendPushNotification';

interface ApproveUserData {
  userId: string;
  email: string;
  username?: string;
  notes?: string;
  verificationId?: string;
  selfieUrl?: string;
}

export const useApproveUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, email, username, notes, verificationId, selfieUrl }: ApproveUserData) => {
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

      // Delete verification selfie after approval
      if (verificationId && selfieUrl) {
        try {
          const { error: deleteError } = await supabase.functions.invoke('delete-verification-selfie', {
            body: { 
              verificationId,
              selfieUrl
            }
          });

          if (deleteError) {
            console.error('Failed to delete verification selfie:', deleteError);
            // Continue with approval process even if deletion fails
          }
        } catch (error) {
          console.error('Error during selfie deletion:', error);
          // Continue with approval process even if deletion fails
        }
      }

      // Notify on-device too — the email often lands hours after the user last
      // checked. Fire-and-forget: approval must not fail because push did.
      sendVerificationApprovedNotification(userId).catch((e) =>
        console.error('Failed to send approval push:', e)
      );

      // Reviews they wrote before verifying are held pending on their selfie. Tell
      // them by name in the approval email — "your review of X" is a far stronger
      // reason to come back than "you're in". Best-effort: the RPC is admin-only and
      // an empty list just means the generic email.
      let heldSubjects: string[] = [];
      try {
        const { data: held } = await supabase.rpc('admin_held_reviews_for_user', {
          _user_id: userId,
        });
        heldSubjects = (held ?? [])
          .map((h: { subject_name: string | null }) => h.subject_name?.trim() ?? '')
          .filter((n: string) => n.length > 0);
      } catch (e) {
        console.error('Failed to load held reviews:', e);
      }

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: { 
          email, 
          username,
          heldSubjects,
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
          description: "User approved and verification selfie deleted for privacy protection!",
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      // Refresh the sidebar pending-count badge immediately.
      queryClient.invalidateQueries({ queryKey: ['admin-pending-counts'] });
      // Their held reviews just became approvable — refresh the posts queue badges.
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
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