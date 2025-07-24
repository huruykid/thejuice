import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Camera, User, Shield, Clock } from "lucide-react";

interface OnboardingTipsProps {
  step: 'profile' | 'selfie' | 'guidelines' | 'pending';
}

const OnboardingTips = ({ step }: OnboardingTipsProps) => {
  const tips = {
    profile: {
      icon: User,
      title: "Creating Your Profile",
      tips: [
        "Choose a unique username that doesn't reveal your real identity",
        "Your age must be 18 or older to join the community",
        "City helps others find local connections and stories",
        "Relationship status helps categorize your stories"
      ]
    },
    selfie: {
      icon: Camera,
      title: "Taking Your Verification Photo",
      tips: [
        "Make sure your face is clearly visible and well-lit",
        "Look directly at the camera",
        "Remove any sunglasses or face coverings",
        "This photo is only used for verification, not displayed publicly"
      ]
    },
    guidelines: {
      icon: Shield,
      title: "Community Standards",
      tips: [
        "Be honest and respectful in all interactions",
        "No harassment, slander, or sharing personal information",
        "One profile per person to maintain authenticity",
        "Violations may result in permanent bans"
      ]
    },
    pending: {
      icon: Clock,
      title: "Verification Review",
      tips: [
        "Our team reviews all new accounts manually",
        "This process usually takes 24-48 hours",
        "You'll receive an email notification when approved",
        "Check your spam folder if you don't see our email"
      ]
    }
  };

  const currentTips = tips[step];
  const Icon = currentTips.icon;

  return (
    <Card className="mt-4 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{currentTips.title}</h4>
            <ul className="space-y-1">
              {currentTips.tips.map((tip, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingTips;