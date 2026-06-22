import { useState } from "react";
import Home from "./Home";
import CreateStory from "@/components/CreateStory";
import EnhancedWelcomeScreen from "@/components/EnhancedWelcomeScreen";
import AuthScreen from "@/components/AuthScreen";
import ProfileCreation from "@/components/ProfileCreation";
import RefactoredSelfieCapture from "@/components/RefactoredSelfieCapture";
import VerificationPending from "@/components/VerificationPending";
import VerificationRejected from "@/components/VerificationRejected";
import OnboardingSuccess from "@/components/OnboardingSuccess";
import EnhancedProgress from "@/components/ui/enhanced-progress";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";
import { useOnboardingState } from "@/hooks/useOnboardingState";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, hasProfile, refetch: refetchProfile } = useProfile(user);
  const { verification, isLoading: verificationLoading, hasVerification, isVerified, isPending, isRejected } = useVerification(user?.id);
  const { currentStep, setCurrentStep, markStepCompleted } = useOnboardingState(user?.id);

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

  const handleProfileCreated = async () => {
    markStepCompleted('profile');
    setCurrentStep('selfie');
    // Force refresh of profile data to recognize the new profile
    await refetchProfile();
  };

  const handleSelfieComplete = (success: boolean) => {
    if (success) {
      markStepCompleted('selfie');
      setCurrentStep('guidelines');
    } else {
      // Stay on selfie step if failed
      setCurrentStep('selfie');
    }
  };

  const handleGuidelinesComplete = () => {
    markStepCompleted('guidelines');
    setCurrentStep('complete');
  };

  const handleApprovalSuccess = () => {
    setShowSuccessAnimation(true);
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
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  // If user exists but no profile, show profile creation
  if (!hasProfile) {
    return (
      <div>
        <div className="p-4">
          <EnhancedProgress 
            currentStep={2} 
            totalSteps={5} 
            steps={onboardingSteps}
            estimatedTimeRemaining="1-2 minutes"
            completedSteps={['Sign Up']}
          />
        </div>
        <ProfileCreation onComplete={handleProfileCreated} />
      </div>
    );
  }

  // Handle verification flow
  if (hasProfile) {
    // If user has ANY verification record, they should stay at step 5
    if (hasVerification) {
      if (isRejected) {
        return (
          <div>
            <div className="p-4">
              <EnhancedProgress 
                currentStep={5} 
                totalSteps={5} 
                steps={onboardingSteps}
                completedSteps={['Sign Up', 'Profile', 'Selfie', 'Guidelines']}
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
              <EnhancedProgress 
                currentStep={5} 
                totalSteps={5} 
                steps={onboardingSteps}
                completedSteps={['Sign Up', 'Profile', 'Selfie', 'Guidelines']}
              />
            </div>
            <VerificationPending onRefresh={refreshVerificationStatus} />
          </div>
        );
      }
      
      // Has verification and it's approved - show success animation first
      if (isVerified) {
        if (showSuccessAnimation) {
          return (
            <OnboardingSuccess 
              onContinue={() => setShowSuccessAnimation(false)} 
            />
          );
        }
        
        return (
          <AppShell onCreateStory={() => setShowCreateStory(true)}>
            <Home onCreateStory={() => setShowCreateStory(true)} />
            {showCreateStory && (
              <CreateStory onClose={() => setShowCreateStory(false)} />
            )}
          </AppShell>
        );
      }
    }
    
    // Only show steps 3-4 for users who have NEVER submitted verification
    if (!hasVerification) {
      // User has profile but no verification - start selfie process
      if (currentStep === 'selfie') {
        return (
          <div>
            <div className="p-4">
              <EnhancedProgress 
                currentStep={3} 
                totalSteps={5} 
                steps={onboardingSteps}
                estimatedTimeRemaining="30 seconds"
                completedSteps={['Sign Up', 'Profile']}
              />
            </div>
            <RefactoredSelfieCapture onComplete={handleSelfieComplete} userId={user.id} />
          </div>
        );
      }
      if (currentStep === 'guidelines') {
        return (
          <div>
            <div className="p-4">
              <EnhancedProgress 
                currentStep={4} 
                totalSteps={5} 
                steps={onboardingSteps}
                estimatedTimeRemaining="1 minute"
                completedSteps={['Sign Up', 'Profile', 'Selfie']}
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
              <EnhancedProgress 
                currentStep={5} 
                totalSteps={5} 
                steps={onboardingSteps}
                completedSteps={['Sign Up', 'Profile', 'Selfie', 'Guidelines']}
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
            <EnhancedProgress 
              currentStep={3} 
              totalSteps={5} 
              steps={onboardingSteps}
              estimatedTimeRemaining="30 seconds"
              completedSteps={['Sign Up', 'Profile']}
            />
          </div>
          <RefactoredSelfieCapture onComplete={handleSelfieComplete} userId={user.id} />
        </div>
      );
    }
    
  }

  // Fallback - show main app (should not reach here normally)
  return (
    <AppShell onCreateStory={() => setShowCreateStory(true)}>
      <Home onCreateStory={() => setShowCreateStory(true)} />
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} />
      )}
    </AppShell>
  );
};

export default Index;
