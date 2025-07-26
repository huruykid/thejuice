import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import TeaAppComparison from "./pages/TeaAppComparison";
import NotFound from "./pages/NotFound";
import CodenameProfile from "./pages/CodenameProfile";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Activity from "./pages/Activity";
import AdminVerifications from "./pages/AdminVerifications";
import PrivacySettings from "./pages/PrivacySettings";
import AuthorStories from "./pages/AuthorStories";
import CreateStory from "./components/CreateStory";
import DatingStoriesForMen from "./pages/DatingStoriesForMen";
import AnonymousDatingReviews from "./pages/AnonymousDatingReviews";
import MensDatingAdvice from "./pages/MensDatingAdvice";
import MaleDatingCommunity from "./pages/MaleDatingCommunity";
import { useAuth } from "./hooks/useAuth";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
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
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

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
          <Route path="/" element={<Landing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/tea-app-comparison" element={<TeaAppComparison />} />
          <Route path="/app" element={<Index />} />
          <Route path="/explore" element={
            <ProtectedRoute>
              <ExploreWrapper />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute>
              <Activity />
            </ProtectedRoute>
          } />
          <Route path="/codename/:codenameId" element={
            <ProtectedRoute>
              <CodenameProfile />
            </ProtectedRoute>
          } />
          <Route path="/admin/verifications" element={
            <ProtectedRoute>
              <AdminVerifications />
            </ProtectedRoute>
          } />
          <Route path="/privacy-settings" element={
            <ProtectedRoute>
              <PrivacySettings />
            </ProtectedRoute>
          } />
          <Route path="/author/:profileId" element={
            <ProtectedRoute>
              <AuthorStories />
            </ProtectedRoute>
          } />
          {/* SEO Landing Pages */}
          <Route path="/dating-stories-for-men" element={<DatingStoriesForMen />} />
          <Route path="/anonymous-dating-reviews" element={<AnonymousDatingReviews />} />
          <Route path="/mens-dating-advice" element={<MensDatingAdvice />} />
          <Route path="/male-dating-community" element={<MaleDatingCommunity />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
