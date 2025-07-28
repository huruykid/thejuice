import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">Create Your Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Tell us about yourself to get started sharing and discovering stories
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProfileForm
            formData={formData}
            onUpdateField={updateField}
            onUpdateUsername={updateUsername}
            onSubmit={handleSubmit}
            isValid={isFormValid}
            isSubmitting={isCreating}
          />
          
          <OnboardingTips step="profile" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCreation;