import { useState } from "react";
import Home from "./Home";
import UnverifiedHome from "./UnverifiedHome";
import CreateStory from "@/components/CreateStory";
import EnhancedWelcomeScreen from "@/components/EnhancedWelcomeScreen";
import AuthScreen from "@/components/AuthScreen";
import ProfileCreation from "@/components/ProfileCreation";
import RefactoredSelfieCapture from "@/components/RefactoredSelfieCapture";
import VerificationPending from "@/components/VerificationPending";
import VerificationRejected from "@/components/VerificationRejected";
import OnboardingSuccess from "@/components/OnboardingSuccess";
import LoadingSkeleton from "@/components/ui/loading-skeleton";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";
import { useOnboardingState } from "@/hooks/useOnboardingState";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  // True once the user opts into the verification flow from UnverifiedHome.
  // Without this, unverified users are NOT force-marched through onboarding.
  const [verifyMode, setVerifyMode] = useState(false);
  // True when the user clicks "Resubmit" from the rejected screen,
  // so we bypass the rejected short-circuit and re-enter the verify flow.
  const [resubmitting, setResubmitting] = useState(false);

  const { user, loading } = useAuth();
  const { isLoading: profileLoading, hasProfile, refetch: refetchProfile } = useProfile(user);
  const {
    verification,
    isLoading: verificationLoading,
    hasVerification,
    isVerified,
    isPending,
    isRejected,
  } = useVerification(user?.id);
  const { currentStep, setCurrentStep, markStepCompleted } = useOnboardingState(user?.id);

  const handleProfileCreated = async () => {
    markStepCompleted("profile");
    setCurrentStep("selfie");
    await refetchProfile();
  };

  const handleSelfieComplete = (success: boolean) => {
    if (success) {
      markStepCompleted("selfie");
      setCurrentStep("guidelines");
    } else {
      setCurrentStep("selfie");
    }
  };

  const handleGuidelinesComplete = () => {
    markStepCompleted("guidelines");
    setCurrentStep("complete");
  };

  const refreshVerificationStatus = () => {
    window.location.reload();
  };

  const startVerification = () => {
    setVerifyMode(true);
    setCurrentStep(hasProfile ? "selfie" : "profile");
  };

  const handleResubmitVerification = () => {
    setResubmitting(true);
    startVerification();
  };

  // Loading
  if (loading) return <LoadingSkeleton message="Checking your authentication..." />;
  if (user && profileLoading) return <LoadingSkeleton type="profile" message="Loading your profile..." />;
  if (user && hasProfile && verificationLoading)
    return <LoadingSkeleton type="verification" message="Checking your verification status..." />;

  if (!user) return <AuthScreen onAuthSuccess={() => {}} />;

  // Verified → full app
  if (isVerified) {
    if (showSuccessAnimation) {
      return <OnboardingSuccess onContinue={() => setShowSuccessAnimation(false)} />;
    }
    return (
      <AppShell onCreateStory={() => setShowCreateStory(true)}>
        <Home onCreateStory={() => setShowCreateStory(true)} />
        {showCreateStory && <CreateStory onClose={() => setShowCreateStory(false)} />}
      </AppShell>
    );
  }

  // Submitted verification: pending / rejected
  if (hasVerification && isPending && !resubmitting) {
    return <VerificationPending onRefresh={refreshVerificationStatus} />;
  }
  if (hasVerification && isRejected && !resubmitting) {
    return (
      <VerificationRejected
        notes={verification?.notes}
        onResubmit={handleResubmitVerification}
      />
    );
  }

  // User opted into the verification flow
  if (verifyMode) {
    if (!hasProfile) {
      return <ProfileCreation onComplete={handleProfileCreated} />;
    }
    if (currentStep === "guidelines") {
      return <EnhancedWelcomeScreen onComplete={handleGuidelinesComplete} />;
    }
    if (currentStep === "complete") {
      return <VerificationPending onRefresh={refreshVerificationStatus} />;
    }
    return <RefactoredSelfieCapture onComplete={handleSelfieComplete} userId={user.id} />;
  }

  // Default: logged-in unverified — soft gate (post freely, read locked)
  return (
    <>
      <UnverifiedHome
        onCreateStory={() => setShowCreateStory(true)}
        onStartVerification={startVerification}
      />
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} isUnverified />
      )}
    </>
  );
};

export default Index;
