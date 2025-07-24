import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import OnboardingTips from '@/components/OnboardingTips';

interface EnhancedWelcomeScreenProps {
  onComplete: () => void;
}

const EnhancedWelcomeScreen = ({ onComplete }: EnhancedWelcomeScreenProps) => {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (!agreed) {
      toast.error('Please agree to the terms and community standards');
      return;
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">Welcome to the Community</CardTitle>
            <CardDescription className="text-muted-foreground">
              Almost done! Please review and agree to our community standards to complete your setup.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Community Guidelines</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>Be honest and respectful</strong> - Share authentic experiences and treat others with respect</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>No harassment, slander, or doxxing</strong> - Keep the community safe and supportive</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>One profile per person</strong> - Maintain authentic community connections</p>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p><strong>Violations may lead to permanent bans</strong> - Help us maintain a positive environment</p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This is a private community focused on authentic connections and honest sharing. 
              By agreeing to these terms, you help us maintain a safe and supportive environment for everyone.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I agree to the terms and community standards
            </label>
          </div>

          <Button 
            onClick={handleContinue}
            disabled={!agreed}
            className="w-full"
            aria-label={agreed ? "Enter the community" : "Please agree to terms first"}
          >
            Enter Community
          </Button>
          
          <OnboardingTips step="guidelines" />
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedWelcomeScreen;