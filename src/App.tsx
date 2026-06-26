import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { SecurityProvider } from "@/components/SecurityProvider";
import AppShell from "@/components/layout/AppShell";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "./components/admin/AdminLayout";
import CreateStory from "./components/CreateStory";
// Entry routes stay eager so first paint isn't gated on a chunk fetch.
import Index from "./pages/Index";
import Landing from "./pages/Landing";
// Everything else is code-split: admin, marketing/SEO, blog, and secondary
// pages no longer ship in the initial bundle (they loaded on every first paint).
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const TeaAppComparison = lazy(() => import("./pages/TeaAppComparison"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Explore = lazy(() => import("./pages/Explore"));
const Profile = lazy(() => import("./pages/Profile"));
const Activity = lazy(() => import("./pages/Activity"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const AdminPosts = lazy(() => import("./pages/AdminPosts"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminDisputes = lazy(() => import("./pages/AdminDisputes"));
const AdminOverview = lazy(() => import("./pages/AdminOverview"));
const SharePublic = lazy(() => import("./pages/SharePublic"));
const DisputeRequest = lazy(() => import("./pages/DisputeRequest"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const AuthorStories = lazy(() => import("./pages/AuthorStories"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const DatingStoriesForMen = lazy(() => import("./pages/DatingStoriesForMen"));
const AnonymousDatingReviews = lazy(() => import("./pages/AnonymousDatingReviews"));
const MensDatingAdvice = lazy(() => import("./pages/MensDatingAdvice"));
const MaleDatingCommunity = lazy(() => import("./pages/MaleDatingCommunity"));
const CompetitorAnalysis = lazy(() => import("./pages/CompetitorAnalysis"));
const ViralMarketingHub = lazy(() => import("./pages/ViralMarketingHub"));
const AutomatedCampaignDashboard = lazy(() => import("./pages/AutomatedCampaignDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Support = lazy(() => import("./pages/Support"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
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
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice dating app logo" className="h-16 w-16 mx-auto animate-pulse" />
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
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice dating app logo" className="h-16 w-16 mx-auto animate-pulse" />
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
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice dating app logo" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return <>{children}</>;
};

/** Shown while a lazily-loaded route chunk is being fetched. */
const RouteFallback = () => (
  <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
    <div className="text-center space-y-4">
      <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice dating app logo" className="h-16 w-16 mx-auto animate-pulse" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
        <Suspense fallback={<RouteFallback />}>
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
          <Route path="/admin/disputes" element={
            <AdminRoute>
              <AdminLayout><AdminDisputes /></AdminLayout>
            </AdminRoute>
          } />
          <Route path="/share" element={<SharePublic />} />
          <Route path="/dispute" element={<PublicLayout><DisputeRequest /></PublicLayout>} />
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
          <Route path="/story/:storyId" element={
            <VerifiedRoute>
              <StoryDetail />
            </VerifiedRoute>
          } />
          {/* SEO Landing Pages */}
          <Route path="/dating-stories-for-men" element={<PublicLayout><DatingStoriesForMen /></PublicLayout>} />
          <Route path="/anonymous-dating-reviews" element={<PublicLayout><AnonymousDatingReviews /></PublicLayout>} />
          <Route path="/mens-dating-advice" element={<PublicLayout><MensDatingAdvice /></PublicLayout>} />
          <Route path="/male-dating-community" element={<PublicLayout><MaleDatingCommunity /></PublicLayout>} />
          <Route path="/competitor-analysis" element={<AdminRoute><CompetitorAnalysis /></AdminRoute>} />
          <Route path="/viral-marketing-hub" element={
            <AdminRoute>
              <ViralMarketingHub />
            </AdminRoute>
          } />
          <Route path="/automated-campaign-dashboard" element={
            <AdminRoute>
              <AutomatedCampaignDashboard />
            </AdminRoute>
          } />
          {/* Blog Routes */}
          <Route path="/blog" element={<PublicLayout><Blog /></PublicLayout>} />
          <Route path="/blog/:slug" element={<PublicLayout><BlogPost /></PublicLayout>} />
          {/* Legal */}
          <Route path="/privacy-policy" element={<PublicLayout><PrivacyPolicy /></PublicLayout>} />
          <Route path="/terms" element={<PublicLayout><Terms /></PublicLayout>} />
          <Route path="/support" element={<PublicLayout><Support /></PublicLayout>} />
          {/* Auth flows */}
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </BrowserRouter>
      </TooltipProvider>
      </SecurityProvider>
    </QueryClientProvider>
  );
};

export default App;
