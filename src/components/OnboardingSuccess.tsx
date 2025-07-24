import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      icon: "💫"
    },
    {
      title: "Discover Insights", 
      description: "Read real stories and learn from the community",
      icon: "🔍"
    },
    {
      title: "Stay Anonymous",
      description: "Share freely while protecting your privacy",
      icon: "🎭"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-6">
          <div className="relative">
            <div className={cn(
              "h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center transition-all duration-1000 transform",
              showAnimation ? "scale-100 rotate-0" : "scale-0 rotate-180"
            )}>
              <Check className="h-10 w-10 text-white" />
            </div>
            
            {showAnimation && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-green-500/20 animate-ping" />
              </div>
            )}
          </div>

          <div className={cn(
            "transition-all duration-700 delay-500",
            step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300">
              🎉 Welcome to Juice!
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Your account has been approved! You're now part of our authentic community.
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className={cn(
            "space-y-4 transition-all duration-700 delay-1000",
            step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <h3 className="font-medium text-center flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              What you can do now:
            </h3>
            
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg bg-background/50 border transition-all duration-500",
                    step >= 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  )}
                  style={{ transitionDelay: `${1200 + index * 200}ms` }}
                >
                  <span className="text-lg">{feature.icon}</span>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(
            "transition-all duration-700 delay-[2000ms]",
            step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Button 
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white"
              size="lg"
            >
              Start Exploring
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className={cn(
            "text-center transition-all duration-700 delay-[2200ms]",
            step >= 3 ? "opacity-100" : "opacity-0"
          )}>
            <p className="text-xs text-muted-foreground">
              Ready to share your first story?
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSuccess;