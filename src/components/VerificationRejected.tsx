import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VerificationRejectedProps {
  notes?: string;
  onResubmit?: () => void;
}

const VerificationRejected = ({ notes, onResubmit }: VerificationRejectedProps) => {
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleContactSupport = () => {
    window.open('mailto:support@sipjuice.app?subject=Verification Appeal', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto" />
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Verification Not Approved</CardTitle>
            <CardDescription className="text-muted-foreground">
              Unfortunately, your verification was not approved
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              We couldn't approve your verification at this time. This could be due to:
            </p>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• Selfie was unclear or didn't show your full face</li>
              <li>• Profile information seemed incomplete or inaccurate</li>
              <li>• Technical issues with your submission</li>
            </ul>
            {notes && (
              <div className="bg-muted p-3 rounded-lg text-left">
                <p className="text-sm font-medium">Review Notes:</p>
                <p className="text-sm text-muted-foreground mt-1">{notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {onResubmit && (
              <Button
                onClick={onResubmit}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Resubmit Verification
              </Button>
            )}

            <Button
              onClick={handleContactSupport}
              variant={onResubmit ? "outline" : "default"}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>

            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationRejected;