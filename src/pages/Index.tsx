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
import { track } from "@/lib/analytics";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  // Name to prefill in the composer — set when a search miss opens it ("Dated her?
  // Be the first"), so the user doesn't retype the name they just searched for.
  const [composePrefill, setComposePrefill] = useState<string>("");
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
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  // /app?compose=1 opens the composer straight away — this is what the installed
  // app's "Post the juice" home-screen shortcut points at (public/manifest.webmanifest),
  // and it works as a plain link too. The param is consumed immediately so a reload
  // or a back-navigation doesn't pop the composer open again.
  useEffect(() => {
    if (!user || searchParams.get("compose") !== "1") return;
    setComposePrefill("");
    setShowCreateStory(true);
    void track("review_started", { prefilled: false, source: "shortcut" });
    const next = new URLSearchParams(searchParams);
    next.delete("compose");
    setSearchParams(next, { replace: true });
  }, [user, searchParams, setSearchParams]);

  // One entry point for the composer. `subjectName` comes from a search miss —
  // the moment of highest intent in the app — and lands prefilled in the composer.
  // Guarded against being wired straight into an onClick (which passes an event).
  const openComposer = (subjectName?: string) => {
    const prefill = typeof subjectName === "string" ? subjectName.trim() : "";
    setComposePrefill(prefill);
    setShowCreateStory(true);
    void track("review_started", { prefilled: prefill.length > 0, verified: isVerified });
  };
  const closeComposer = () => {
    setShowCreateStory(false);
    setComposePrefill("");
  };
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
      // Client-side "approved" signal — fires the first time this browser sees the
      // account verified. Approval itself happens in admin, where GA can't see it.
      void track("verification_approved");
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
      <AppShell onCreateStory={() => openComposer()}>
        <Home onCreateStory={openComposer} />
        {showCreateStory && (
          <CreateStory onClose={closeComposer} initialSubjectName={composePrefill} />
        )}
      </AppShell>
    );
  }

  // Submitted verification: pending / rejected.
  // Pending users can post (it's held until they're approved) — the search miss on
  // this screen is the moment they're most motivated, so the composer lives here too.
  if (hasVerification && isPending && !resubmitting) {
    return (
      <>
        <VerificationPending
          onRefresh={refreshVerificationStatus}
          submittedAt={verification?.created_at}
          onCreateStory={openComposer}
        />
        {showCreateStory && (
          <CreateStory
            onClose={closeComposer}
            isUnverified
            initialSubjectName={composePrefill}
          />
        )}
      </>
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
        onCreateStory={openComposer}
        onStartVerification={startVerification}
        resumeVerification={hasProfile && !hasVerification}
      />
      {showCreateStory && (
        <CreateStory
          onClose={closeComposer}
          isUnverified
          initialSubjectName={composePrefill}
        />
      )}
    </>
  );
};

export default Index;
