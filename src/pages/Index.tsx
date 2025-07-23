import { useState, useEffect } from "react";
import Home from "./Home";
import CreateStory from "@/components/CreateStory";
import WelcomeScreen from "@/components/WelcomeScreen";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    // Check if user has already completed onboarding
    return !localStorage.getItem('onboardingCompleted');
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowWelcome(false);
  };

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
