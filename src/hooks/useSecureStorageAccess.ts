import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useSecurityEventLogger } from './useSecurityAudit';

export const useSecureStorageAccess = () => {
  const { toast } = useToast();
  const { logSuspiciousActivity } = useSecurityEventLogger();

  const getSecureUrl = useCallback(async (
    bucket: string,
    path: string,
    expiresIn: number = 3600 // 1 hour default
  ) => {
    try {
      // Log file access for audit trail
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.rpc('log_file_access', {
          p_user_id: user.user.id,
          p_bucket_id: bucket,
          p_object_path: path,
          p_action: 'access_request'
        });
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Storage access error:', error);
        toast({
          title: "Access denied",
          description: "Unable to access the requested file.",
          variant: "destructive"
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Secure storage access error:', error);
      logSuspiciousActivity('unauthorized_storage_access', {
        bucket,
        path,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }, [toast, logSuspiciousActivity]);

  const deleteSecureFile = useCallback(async (
    bucket: string,
    path: string
  ) => {
    try {
      // Log deletion attempt
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.rpc('log_file_access', {
          p_user_id: user.user.id,
          p_bucket_id: bucket,
          p_object_path: path,
          p_action: 'delete_request'
        });
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('File deletion error:', error);
        toast({
          title: "Deletion failed",
          description: "Unable to delete the file.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Secure file deletion error:', error);
      return false;
    }
  }, [toast]);

  return {
    getSecureUrl,
    deleteSecureFile
  };
};