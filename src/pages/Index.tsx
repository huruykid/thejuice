import { useState } from "react";
import Home from "./Home";
import CreateStory from "@/components/CreateStory";
import EnhancedWelcomeScreen from "@/components/EnhancedWelcomeScreen";
import AuthScreen from "@/components/AuthScreen";
import ProfileCreation from "@/components/ProfileCreation";
import SelfieCapture from "@/components/SelfieCapture";
import VerificationPending from "@/components/VerificationPending";
import VerificationRejected from "@/components/VerificationRejected";
import OnboardingProgress from "@/components/OnboardingProgress";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [currentStep, setCurrentStep] = useState<'profile' | 'selfie' | 'guidelines' | 'complete'>('profile');
  
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, hasProfile } = useProfile(user);
  const { verification, isLoading: verificationLoading, hasVerification, isVerified, isPending, isRejected } = useVerification(user?.id);

  // Onboarding steps configuration
  const onboardingSteps = ['Sign Up', 'Profile', 'Selfie', 'Guidelines', 'Review'];
  
  const getCurrentStepNumber = () => {
    if (!user) return 1;
    if (!hasProfile) return 2;
    if (!hasVerification) return 3;
    if (currentStep === 'guidelines') return 4;
    if (isPending || isRejected) return 5;
    return 5;
  };

  const handleProfileCreated = () => {
    setCurrentStep('selfie');
  };

  const handleSelfieComplete = () => {
    setCurrentStep('guidelines');
  };

  const handleGuidelinesComplete = () => {
    // Guidelines completed - user should now see pending verification screen
    // The verification record should already exist from selfie upload
    setCurrentStep('complete');
  };

  const refreshVerificationStatus = () => {
    // This will trigger a re-fetch of verification data
    window.location.reload();
  };

  // Loading states with better UX
  if (loading) {
    return <LoadingSkeleton message="Checking your authentication..." />;
  }

  if (user && profileLoading) {
    return <LoadingSkeleton type="profile" message="Loading your profile..." />;
  }

  if (user && hasProfile && verificationLoading) {
    return <LoadingSkeleton type="verification" message="Checking your verification status..." />;
  }

  if (!user) {
    return (
      <div>
        <div className="p-4">
          <OnboardingProgress 
            currentStep={1} 
            totalSteps={5} 
            steps={onboardingSteps} 
          />
        </div>
        <AuthScreen onAuthSuccess={() => {}} />
      </div>
    );
  }

  // If user exists but no profile, show profile creation
  if (!hasProfile) {
    return (
      <div>
        <div className="p-4">
          <OnboardingProgress 
            currentStep={2} 
            totalSteps={5} 
            steps={onboardingSteps} 
          />
        </div>
        <ProfileCreation onComplete={handleProfileCreated} />
      </div>
    );
  }

  // Handle verification flow
  if (hasProfile) {
    // Check verification status
    if (isRejected) {
      return (
        <div>
          <div className="p-4">
            <OnboardingProgress 
              currentStep={5} 
              totalSteps={5} 
              steps={onboardingSteps} 
            />
          </div>
          <VerificationRejected notes={verification?.notes} />
        </div>
      );
    }
    
    if (isPending) {
      return (
        <div>
          <div className="p-4">
            <OnboardingProgress 
              currentStep={5} 
              totalSteps={5} 
              steps={onboardingSteps} 
            />
          </div>
          <VerificationPending onRefresh={refreshVerificationStatus} />
        </div>
      );
    }
    
    if (!hasVerification) {
      // User has profile but no verification - start selfie process
      if (currentStep === 'selfie') {
        return (
          <div>
            <div className="p-4">
              <OnboardingProgress 
                currentStep={3} 
                totalSteps={5} 
                steps={onboardingSteps} 
              />
            </div>
            <SelfieCapture onComplete={(success) => success && handleSelfieComplete()} userId={user.id} />
          </div>
        );
      }
      if (currentStep === 'guidelines') {
        return (
          <div>
            <div className="p-4">
              <OnboardingProgress 
                currentStep={4} 
                totalSteps={5} 
                steps={onboardingSteps} 
              />
            </div>
            <EnhancedWelcomeScreen onComplete={handleGuidelinesComplete} />
          </div>
        );
      }
      if (currentStep === 'complete') {
        // Guidelines completed but verification record might not be loaded yet
        return (
          <div>
            <div className="p-4">
              <OnboardingProgress 
                currentStep={5} 
                totalSteps={5} 
                steps={onboardingSteps} 
              />
            </div>
            <VerificationPending onRefresh={refreshVerificationStatus} />
          </div>
        );
      }
      // Default to selfie step if no verification exists
      return (
        <div>
          <div className="p-4">
            <OnboardingProgress 
              currentStep={3} 
              totalSteps={5} 
              steps={onboardingSteps} 
            />
          </div>
          <SelfieCapture onComplete={(success) => success && handleSelfieComplete()} userId={user.id} />
        </div>
      );
    }
    
    if (!isVerified) {
      // Has verification but not approved yet
      return (
        <div>
          <div className="p-4">
            <OnboardingProgress 
              currentStep={5} 
              totalSteps={5} 
              steps={onboardingSteps} 
            />
          </div>
          <VerificationPending onRefresh={refreshVerificationStatus} />
        </div>
      );
    }
  }

  // User is fully verified - show main app
  return (
    <>
      <Home onCreateStory={() => setShowCreateStory(true)} />
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} />
      )}
    </>
  );
};

export default Index;
