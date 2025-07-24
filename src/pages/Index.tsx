import { useState } from "react";
import Home from "./Home";
import CreateStory from "@/components/CreateStory";
import WelcomeScreen from "@/components/WelcomeScreen";
import AuthScreen from "@/components/AuthScreen";
import UsernameCreation from "@/components/UsernameCreation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has already completed onboarding
    return !localStorage.getItem('onboardingCompleted');
  });
  
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, hasProfile } = useProfile(user);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowWelcome(false);
  };

  const handleUsernameCreated = () => {
    // Refresh profile data and proceed to onboarding if needed
    if (!localStorage.getItem('onboardingCompleted')) {
      setShowWelcome(true);
    }
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
    return <AuthScreen onAuthSuccess={handleUsernameCreated} />;
  }

  // If user exists but no profile, show username creation
  if (!hasProfile) {
    return <UsernameCreation onComplete={handleUsernameCreated} />;
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleOnboardingComplete} />;
  }

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
