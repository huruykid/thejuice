import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateProfileData, rateLimiter } from '@/lib/security';
import { useSecurityEventLogger } from '@/hooks/useSecurityAudit';
import { useProfile } from '@/hooks/useProfile';
import type { ProfileFormData } from './useProfileForm';

export const useProfileCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { checkUsernameAvailability, refetch } = useProfile();
  const { logProfileUpdate, logSuspiciousActivity } = useSecurityEventLogger();

  const createProfile = async (
    formData: ProfileFormData,
    onSuccess: () => void
  ): Promise<void> => {
    // Prevent double-clicks
    if (isCreating) return;

    // Rate limiting check
    const rateLimitKey = `profile_creation:${formData.username}`;
    if (!rateLimiter.isAllowed(rateLimitKey, 5, 60 * 60 * 1000)) {
      const timeUntilReset = rateLimiter.getTimeUntilReset(rateLimitKey, 60 * 60 * 1000);
      const minutesLeft = Math.ceil(timeUntilReset / (60 * 1000));
      
      logSuspiciousActivity('profile_creation_rate_limit', {
        username: formData.username,
        minutes_until_reset: minutesLeft
      });
      
      toast.error(`Too many attempts. Please wait ${minutesLeft} minutes before trying again.`);
      return;
    }

    setIsCreating(true);

    try {
      // Final username availability check
      const stillAvailable = await checkUsernameAvailability(formData.username);
      if (!stillAvailable) {
        toast.error('Username is no longer available. Please choose another.');
        setIsCreating(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate and sanitize profile data
      const profileData = {
        anonymous_username: formData.username,
        phone_number: formData.phoneNumber,
        city: formData.city,
        relationship_status: formData.relationshipStatus
      };

      const validation = validateProfileData(profileData);
      if (!validation.isValid) {
        toast.error(validation.errors[0]);
        setIsCreating(false);
        return;
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const profileUpdateData = {
        ...validation.sanitizedData,
        date_of_birth: formData.dateOfBirth
      };
      
      let error;
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update(profileUpdateData)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Create new profile
        const result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            ...profileUpdateData
          });
        error = result.error;
      }

      if (error) {
        handleProfileError(error);
        return;
      }

      // Log successful profile creation
      logProfileUpdate(Object.keys(profileUpdateData));

      // Force refresh of profile data
      await refetch();

      toast.success('✨ Profile created! Taking your selfie next...');
      onSuccess();

    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleProfileError = (error: any) => {
    if (error.code === '23505') { // Unique violation
      toast.error('Username is already taken');
    } else if (error.message.includes('age_check')) {
      toast.error('You must be 18 or older to join');
    } else if (error.message.includes('phone number')) {
      toast.error('Invalid phone number format');
    } else {
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return {
    isCreating,
    createProfile
  };
};