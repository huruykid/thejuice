import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
import { usePushNotifications } from "@/hooks/usePushNotifications";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const queryClient = useQueryClient();
  // True once the user opts into the verification flow from UnverifiedHome.
  // Without this, unverified users are NOT force-marched through onboarding.
  const [verifyMode, setVerifyMode] = useState(false);
  // True when the user clicks "Resubmit" from the rejected screen,
  // so we bypass the rejected short-circuit and re-enter the verify flow.
  const [resubmitting, setResubmitting] = useState(false);

  const { user, loading } = useAuth();
  usePushNotifications(user?.id);
  const { isLoading: profileLoading, hasProfile, refetch: refetchProfile } = useProfile(user);
  const {
    verification,
    isLoading: verificationLoading,
    hasVerification,
    isVerified,
    isPending,
    isRejected,
  } = useVerification(user?.id);
  const { currentStep, setCurrentStep, markStepCompleted, isStepCompleted } = useOnboardingState(user?.id);

  // Honor a returnTo deep link (set by LoginRedirect for gated routes) once the
  // user is verified, so a shared /story/:id link survives the login round-trip.
  // Only same-origin paths are allowed — no protocol-relative or absolute URLs.
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  useEffect(() => {
    if (verificationLoading || !isVerified || !returnTo) return;
    if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      navigate(returnTo, { replace: true });
    }
  }, [verificationLoading, isVerified, returnTo, navigate]);

  // Show the success animation exactly once — the first time this user is verified,
  // regardless of whether they were in the app when it happened or came back later.
  useEffect(() => {
    if (verificationLoading || !user || !isVerified) return;
    const key = `juice_welcome_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setShowSuccessAnimation(true);
    }
  }, [isVerified, verificationLoading, user]);

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

  const refreshVerificationStatus = async () => {
    await queryClient.invalidateQueries({ queryKey: ['user-verification', user?.id] });
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
    return (
      <VerificationPending
        onRefresh={refreshVerificationStatus}
        submittedAt={verification?.created_at}
      />
    );
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
    // Guard: only advance to guidelines if the selfie step is actually completed.
    // Without this check, a user who manually edits localStorage to set
    // currentStep="guidelines" would bypass the selfie (the verification artifact).
    if (currentStep === "guidelines" && isStepCompleted("selfie")) {
      return <EnhancedWelcomeScreen onComplete={handleGuidelinesComplete} />;
    }
    if (currentStep === "complete" && isStepCompleted("selfie")) {
      return <VerificationPending onRefresh={refreshVerificationStatus} />;
    }
    // Default: render selfie capture (handles both initial and tampered state)
    return <RefactoredSelfieCapture onComplete={handleSelfieComplete} userId={user.id} />;
  }

  // Default: logged-in unverified — soft gate (post freely, read locked)
  return (
    <>
      <UnverifiedHome
        onCreateStory={() => setShowCreateStory(true)}
        onStartVerification={startVerification}
        resumeVerification={hasProfile && !hasVerification}
      />
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} isUnverified />
      )}
    </>
  );
};

export default Index;
