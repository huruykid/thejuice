import OnboardingScaffold from "@/components/layout/OnboardingScaffold";
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
    <OnboardingScaffold>
      <div className="space-y-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Selfie received</h2>
          <p className="text-sm text-muted-foreground">
            You're in the review queue — nothing more to do right now.
          </p>
        </div>

        <div className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">
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
              <a href="/support" className="font-semibold text-primary hover:underline">
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

        {/* While you wait — let pending users explore who already has tea */}
        <div className="border-t border-border pt-5">
          <p className="mb-2 text-center text-sm font-semibold text-foreground">
            While you wait — look someone up
          </p>
          <SubjectSearch pending />
        </div>
      </div>
    </OnboardingScaffold>
  );
};

export default VerificationPending;
