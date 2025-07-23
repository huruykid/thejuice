import { useState } from "react";
import Home from "./Home";
import CreateStory from "@/components/CreateStory";
import WelcomeScreen from "@/components/WelcomeScreen";

const Index = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
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
