import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { SecurityProvider } from "@/components/SecurityProvider";
import AppShell from "@/components/layout/AppShell";
import PublicLayout from "@/components/layout/PublicLayout";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import TeaAppComparison from "./pages/TeaAppComparison";
import NotFound from "./pages/NotFound";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Activity from "./pages/Activity";
import AdminVerifications from "./pages/AdminVerifications";
import AdminPosts from "./pages/AdminPosts";
import AdminReports from "./pages/AdminReports";
import AdminOverview from "./pages/AdminOverview";
import AdminLayout from "./components/admin/AdminLayout";
import SharePublic from "./pages/SharePublic";
import PrivacySettings from "./pages/PrivacySettings";
import AuthorStories from "./pages/AuthorStories";
import CreateStory from "./components/CreateStory";
import DatingStoriesForMen from "./pages/DatingStoriesForMen";
import AnonymousDatingReviews from "./pages/AnonymousDatingReviews";
import MensDatingAdvice from "./pages/MensDatingAdvice";
import MaleDatingCommunity from "./pages/MaleDatingCommunity";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import ViralMarketingHub from "./pages/ViralMarketingHub";
import AutomatedCampaignDashboard from "./pages/AutomatedCampaignDashboard";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import ResetPassword from "./pages/ResetPassword";
import { useAuth } from "./hooks/useAuth";
import { useVerification } from "./hooks/useVerification";
import { useRealIsAdmin } from "./hooks/useRealIsAdmin";
import { useScreenshotProtection } from "./hooks/useScreenshotProtection";
import { useIosCaptureProtection } from "./hooks/useIosCaptureProtection";
import { useTheme } from "./hooks/useTheme";
import ViewAsBar from "./components/ViewAsBar";

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

/**
 * Like ProtectedRoute, but additionally requires an approved verification.
 * Unverified / pending / rejected users are bounced to /app where Index
 * renders the correct gating screen (UnverifiedHome, Pending, Rejected, ...).
 */
const VerifiedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isVerified, isLoading: verificationLoading } = useVerification(user?.id);

  if (loading || (user && verificationLoading)) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isVerified) return <Navigate to="/app" replace />;

  return <>{children}</>;
};

/**
 * Guards admin routes — redirects to / if the user is not an admin.
 * Shows the same loading spinner as ProtectedRoute while the role check resolves,
 * so there's no flash of admin UI for non-admins.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useRealIsAdmin(user?.id);

  if (loading || (user && adminLoading)) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return <>{children}</>;
};

const ExploreWrapper = () => {
  const [showCreateStory, setShowCreateStory] = useState(false);
  
  return (
    <AppShell onCreateStory={() => setShowCreateStory(true)}>
      <Explore onCreateStory={() => setShowCreateStory(true)} />
      {showCreateStory && (
        <CreateStory onClose={() => setShowCreateStory(false)} />
      )}
    </AppShell>
  );
};

const queryClient = new QueryClient();

const App = () => {
  // Enable screenshot protection across the entire app (web + iOS native)
  useScreenshotProtection();
  useIosCaptureProtection();
  // Initialise theme (light / dark / system) at the root so the toggle works app-wide
  useTheme();
  
  return (

    <QueryClientProvider client={queryClient}>
      <SecurityProvider sessionTimeoutMinutes={30}>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ViewAsBar />
        <Routes>
          <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
          <Route path="/how-it-works" element={<PublicLayout><HowItWorks /></PublicLayout>} />
          <Route path="/tea-app-comparison" element={<PublicLayout><TeaAppComparison /></PublicLayout>} />
          <Route path="/app" element={<Index />} />
          <Route path="/explore" element={
            <VerifiedRoute>
              <ExploreWrapper />
            </VerifiedRoute>
          } />
          <Route path="/near-you" element={<Navigate to="/app" replace />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute>
              <AppShell>
                <Activity />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout><AdminOverview /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/verifications" element={
            <AdminRoute>
              <AdminLayout><AdminVerifications /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/posts" element={
            <AdminRoute>
              <AdminLayout><AdminPosts /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <AdminLayout><AdminReports /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/share" element={<SharePublic />} />
          <Route path="/privacy-settings" element={
            <ProtectedRoute>
              <AppShell showRightRail={false}>
                <PrivacySettings />
              </AppShell>
            </ProtectedRoute>
          } />
          <Route path="/author/:profileId" element={
            <ProtectedRoute>
              <AppShell>
                <AuthorStories />
              </AppShell>
            </ProtectedRoute>
          } />
          {/* SEO Landing Pages */}
          <Route path="/dating-stories-for-men" element={<PublicLayout><DatingStoriesForMen /></PublicLayout>} />
          <Route path="/anonymous-dating-reviews" element={<PublicLayout><AnonymousDatingReviews /></PublicLayout>} />
          <Route path="/mens-dating-advice" element={<PublicLayout><MensDatingAdvice /></PublicLayout>} />
          <Route path="/male-dating-community" element={<PublicLayout><MaleDatingCommunity /></PublicLayout>} />
          <Route path="/competitor-analysis" element={<PublicLayout><CompetitorAnalysis /></PublicLayout>} />
          <Route path="/viral-marketing-hub" element={
            <ProtectedRoute>
              <ViralMarketingHub />
            </ProtectedRoute>
          } />
          <Route path="/automated-campaign-dashboard" element={
            <ProtectedRoute>
              <AutomatedCampaignDashboard />
            </ProtectedRoute>
          } />
          {/* Blog Routes */}
          <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
          <Route path="/blog/:slug" element={<PublicLayout><BlogPost /></PublicLayout>} />
          {/* Legal */}
          <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
          <Route path="/support" element={<PublicLayout><Support /></PublicLayout>} />
          {/* Auth flows */}
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
};

export default App;
