import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useSecurityEventLogger } from './useSecurityAudit';

interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
  bucket: string;
}

export const useEnhancedFileUpload = () => {
  const { toast } = useToast();
  const { logSuspiciousActivity } = useSecurityEventLogger();

  const validateFile = useCallback(async (
    file: File,
    options: FileValidationOptions
  ): Promise<boolean> => {
    try {
      // Check with server-side validation
      const { data, error } = await supabase.rpc('validate_file_upload', {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        bucket_name: options.bucket
      });

      if (error) {
        console.error('File validation error:', error);
        toast({
          title: "File validation failed",
          description: "Unable to validate file. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      if (!data) {
        // Log suspicious file upload attempt
        logSuspiciousActivity('malicious_file_upload', {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          bucket: options.bucket
        });

        toast({
          title: "Invalid file",
          description: "File type or size not allowed.",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('File validation error:', error);
      return false;
    }
  }, [toast, logSuspiciousActivity]);

  const uploadFile = useCallback(async (
    file: File,
    path: string,
    bucket: string
  ) => {
    // Validate file first
    const isValid = await validateFile(file, { bucket });
    if (!isValid) {
      return { data: null, error: new Error('File validation failed') };
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { data, error };
  }, [validateFile, toast]);

  return {
    validateFile,
    uploadFile
  };
};