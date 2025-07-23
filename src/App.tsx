import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CodenameProfile from "./pages/CodenameProfile";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Comments from "./pages/Comments";
import CreateStory from "./components/CreateStory";

const ExploreWrapper = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  
  return (
    <>
      <Explore onCreateStory={() => setShowCreateStory(true)} />
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} />
      )}
    </>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<ExploreWrapper />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/comments" element={<Comments />} />
          <Route path="/codename/:codenameId" element={<CodenameProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
