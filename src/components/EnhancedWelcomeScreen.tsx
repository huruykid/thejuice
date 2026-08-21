import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import OnboardingScaffold from "@/components/layout/OnboardingScaffold";
import OnboardingTips from '@/components/OnboardingTips';

interface EnhancedWelcomeScreenProps {
  onComplete: () => void;
}

const GUIDELINES = [
  ["Be honest and respectful", "Share authentic experiences and treat others with respect"],
  ["No harassment, slander, or doxxing", "Keep the community safe and supportive"],
  ["One profile per person", "Maintain authentic community connections"],
  ["Violations may lead to permanent bans", "Help us maintain a positive environment"],
] as const;

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
    <OnboardingScaffold
      step={1}
      cta={
        <Button
          onClick={handleContinue}
          disabled={!agreed}
          size="lg"
          className="w-full"
          aria-label={agreed ? "Enter the community" : "Please agree to terms first"}
        >
          Enter Community
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome to the Community</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Almost done! Please review and agree to our community standards to complete your setup.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Community Guidelines</h3>

          <div className="space-y-3 text-sm">
            {GUIDELINES.map(([title, detail]) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <p>
                  <strong>{title}</strong> — {detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            This is a private community focused on authentic connections and honest sharing.
            By agreeing to these terms, you help us maintain a safe and supportive environment for everyone.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2 py-1">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <span className="text-sm font-medium leading-none">
            I agree to the terms and community standards
          </span>
        </label>

        <OnboardingTips step="guidelines" />
      </div>
    </OnboardingScaffold>
  );
};

export default EnhancedWelcomeScreen;
