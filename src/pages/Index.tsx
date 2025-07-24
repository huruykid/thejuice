import { useState } from "react";
import Home from "./Home";
import CreateStory from "@/components/CreateStory";
import EnhancedWelcomeScreen from "@/components/EnhancedWelcomeScreen";
import AuthScreen from "@/components/AuthScreen";
import ProfileCreation from "@/components/ProfileCreation";
import SelfieCapture from "@/components/SelfieCapture";
import VerificationPending from "@/components/VerificationPending";
import VerificationRejected from "@/components/VerificationRejected";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [currentStep, setCurrentStep] = useState<'profile' | 'selfie' | 'guidelines' | 'complete'>('profile');
  
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, hasProfile } = useProfile(user);
  const { verification, isLoading: verificationLoading, hasVerification, isVerified, isPending, isRejected } = useVerification(user?.id);

  const handleProfileCreated = () => {
    setCurrentStep('selfie');
  };

  const handleSelfieComplete = () => {
    setCurrentStep('guidelines');
  };

  const handleGuidelinesComplete = () => {
    setCurrentStep('complete');
  };

  const refreshVerificationStatus = () => {
    // This will trigger a re-fetch of verification data
    window.location.reload();
  };

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={() => {}} />;
  }

  // Loading verification status
  if (user && verificationLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user exists but no profile, show profile creation
  if (!hasProfile) {
    return <ProfileCreation onComplete={handleProfileCreated} />;
  }

  // Handle verification flow
  if (hasProfile) {
    // Check verification status
    if (isRejected) {
      return <VerificationRejected notes={verification?.notes} />;
    }
    
    if (isPending) {
      return <VerificationPending onRefresh={refreshVerificationStatus} />;
    }
    
    if (!hasVerification) {
      // User has profile but no verification - start selfie process
      if (currentStep === 'selfie') {
        return <SelfieCapture onComplete={(success) => success && handleSelfieComplete()} userId={user.id} />;
      }
      if (currentStep === 'guidelines') {
        return <EnhancedWelcomeScreen onComplete={handleGuidelinesComplete} />;
      }
      // Default to selfie step if no verification exists
      return <SelfieCapture onComplete={(success) => success && handleSelfieComplete()} userId={user.id} />;
    }
    
    if (!isVerified) {
      // Has verification but not approved yet
      return <VerificationPending onRefresh={refreshVerificationStatus} />;
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
