import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ImageQuality } from './useImageProcessing';

export const useVerificationUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadVerification = async (
    imageData: string,
    userId: string,
    quality: ImageQuality
  ): Promise<boolean> => {
    // Prevent double-clicks and ensure we have data
    if (!imageData || isUploading) return false;

    // Prevent upload of poor quality images
    if (quality === 'poor') {
      toast({
        title: "Photo Quality Too Low",
        description: "Please take a clearer photo with better lighting before proceeding.",
        variant: "destructive",
      });
      return false;
    }

    setIsUploading(true);
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      const fileName = `${userId}/${Date.now()}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('verification-selfies')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification-selfies')
        .getPublicUrl(fileName);

      // Save verification record
      const { error: dbError } = await supabase
        .from('user_verifications')
        .upsert({
          user_id: userId,
          selfie_url: publicUrl,
          verification_status: 'pending',
          updated_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      toast({
        title: "✨ Photo Submitted Successfully!",
        description: "Next, please review our community guidelines.",
      });

      return true;
    } catch (error) {
      console.error('Error uploading selfie:', error);
      toast({
        title: "Upload Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const validateFile = (file: File): boolean => {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      });
      return false;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    isUploading,
    uploadVerification,
    validateFile
  };
};