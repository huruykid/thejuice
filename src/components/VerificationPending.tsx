import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import OnboardingTips from '@/components/OnboardingTips';

interface VerificationPendingProps {
  onRefresh: () => void;
}

const VerificationPending = ({ onRefresh }: VerificationPendingProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto" />
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Account Pending Approval</CardTitle>
            <CardDescription className="text-muted-foreground">
              You're all set! Your account is being reviewed by our team.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Congratulations! You've completed all the setup steps. Our team is now reviewing your submission to ensure you're part of our authentic community.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li>• Manual review (usually 24-48 hours)</li>
              <li>• Email notification when approved</li>
              <li>• Full access to share and discover stories</li>
            </ul>
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
    </div>
  );
};

export default VerificationPending;