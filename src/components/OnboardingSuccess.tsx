import { useState, useEffect } from 'react';
import OnboardingScaffold from "@/components/layout/OnboardingScaffold";
import { Button } from '@/components/ui/button';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingSuccessProps {
  onContinue: () => void;
}

const OnboardingSuccess = ({ onContinue }: OnboardingSuccessProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Trigger animation sequence
    const timeouts = [
      setTimeout(() => setShowAnimation(true), 100),
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1600),
      setTimeout(() => setStep(3), 2400),
    ];

    return () => timeouts.forEach(clearTimeout);
  }, []);

  const features = [
    {
      title: "Share Your Stories",
      description: "Connect with others through authentic relationship experiences",
    },
    {
      title: "Discover Insights",
      description: "Read real stories and learn from the community",
    },
    {
      title: "Stay Anonymous",
      description: "Share freely while protecting your privacy",
    }
  ];

  return (
    <OnboardingScaffold
      cta={
        <div
          className={cn(
            "transition-all duration-700",
            step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <Button onClick={onContinue} className="w-full" size="lg">
            Look someone up
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Ready to share your first story?
          </p>
        </div>
      }
    >
      <div className="space-y-8 pt-6">
        <div className="relative">
          <div className={cn(
            "mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success transition-all duration-1000",
            showAnimation ? "scale-100 rotate-0" : "scale-0 rotate-180"
          )}>
            <Check className="h-10 w-10 text-success-foreground" />
          </div>

          {showAnimation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 animate-ping rounded-full bg-success/20" />
            </div>
          )}
        </div>

        <div className={cn(
          "text-center transition-all duration-700 delay-500",
          step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h2 className="text-2xl font-bold text-success">You're in 🎉</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has been approved! You're now part of our authentic community.
          </p>
        </div>

        <div className={cn(
          "space-y-4 transition-all duration-700 delay-1000",
          step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <h3 className="flex items-center justify-center gap-2 text-center font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            What you can do now:
          </h3>

          <div className="space-y-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-all duration-500",
                  step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                )}
                style={{ transitionDelay: `${1200 + index * 200}ms` }}
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-3.5 w-3.5 text-success" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OnboardingScaffold>
  );
};

export default OnboardingSuccess;
