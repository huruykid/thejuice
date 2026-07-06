import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BrandLockup from "@/components/BrandLockup";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import OnboardingTips from '@/components/OnboardingTips';
import SubjectSearch from '@/components/SubjectSearch';

interface VerificationPendingProps {
  onRefresh: () => void;
  /** When the selfie was submitted — drives the "taking longer than expected" escape hatch. */
  submittedAt?: string | null;
}

const VerificationPending = ({ onRefresh, submittedAt }: VerificationPendingProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const overdue =
    !!submittedAt && Date.now() - new Date(submittedAt).getTime() > 48 * 60 * 60 * 1000;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
      onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center p-4 py-8 gap-5">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <BrandLockup variant="mark" size="lg" className="mx-auto" />
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Selfie received</CardTitle>
            <CardDescription className="text-muted-foreground">
              You're in the review queue — nothing more to do right now.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-3">
            <p className="text-muted-foreground">
              We review every verification by hand &mdash; usually within{" "}
              <strong className="text-foreground">24&ndash;48 hours</strong>. You'll get an email the
              moment you're approved, and then every story unlocks.
            </p>
            <p className="text-sm text-muted-foreground">
              No need to keep checking back &mdash; we'll come to you.
            </p>
            {overdue && (
              <p className="text-sm text-muted-foreground">
                Taking longer than 48 hours?{" "}
                <a href="/support" className="text-primary font-semibold hover:underline">
                  Contact support
                </a>{" "}
                and we'll chase it down.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline"
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Status
                </>
              )}
            </Button>

            <Button 
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-muted-foreground"
              aria-label="Sign out of your account"
            >
              Sign Out
            </Button>
          </div>
          
          <OnboardingTips step="pending" />
        </CardContent>
      </Card>

      {/* While you wait — let pending users explore who already has tea */}
      <div className="w-full max-w-md">
        <p className="text-sm font-semibold text-foreground text-center mb-2">
          While you wait — look someone up
        </p>
        <SubjectSearch pending />
      </div>
    </div>
  );
};

export default VerificationPending;