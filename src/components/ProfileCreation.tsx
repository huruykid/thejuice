import OnboardingScaffold from "@/components/layout/OnboardingScaffold";
import { useProfileForm } from '@/hooks/useProfileForm';
import { useProfileCreation } from '@/hooks/useProfileCreation';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import { ProfileForm } from '@/components/ProfileCreation/ProfileForm';
import OnboardingTips from '@/components/OnboardingTips';

interface ProfileCreationProps {
  onComplete: () => void;
}

const ProfileCreation = ({ onComplete }: ProfileCreationProps) => {
  const { formData, updateField, updateUsername, validateForm, calculateAge } = useProfileForm();
  const { isAvailable } = useUsernameValidation(formData.username);
  const { isCreating, createProfile } = useProfileCreation();

  const handleSubmit = async () => {
    const validation = validateForm(isAvailable || false);
    if (!validation.isValid) {
      return; // Form validation errors are handled in the validation
    }

    await createProfile(formData, onComplete);
  };

  const isFormValid = formData.username &&
    isAvailable &&
    formData.dateOfBirth &&
    formData.city.trim() &&
    formData.relationshipStatus &&
    calculateAge(formData.dateOfBirth) >= 18;

  return (
    <OnboardingScaffold step={2}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Your Profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us about yourself to get started sharing and discovering stories
          </p>
        </div>

        <ProfileForm
          formData={formData}
          onUpdateField={updateField}
          onUpdateUsername={updateUsername}
          onSubmit={handleSubmit}
          isValid={isFormValid}
          isSubmitting={isCreating}
        />

        <OnboardingTips step="profile" />
      </div>
    </OnboardingScaffold>
  );
};

export default ProfileCreation;
