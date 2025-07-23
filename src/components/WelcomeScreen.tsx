import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Heart, Shield, Users, Sparkles } from "lucide-react";
// import juiceLogo from "@/assets/juice-logo.png";
interface WelcomeScreenProps {
  onComplete: () => void;
}
const WelcomeScreen = ({
  onComplete
}: WelcomeScreenProps) => {
  const [step, setStep] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const features = [{
    icon: Shield,
    title: "Anonymous & Safe",
    description: "Share your dating stories without revealing your identity"
  }, {
    icon: Heart,
    title: "Real Experiences",
    description: "Rate and review dating experiences to help the community"
  }, {
    icon: Users,
    title: "Invite Only",
    description: "Join a trusted community of people sharing authentic stories"
  }, {
    icon: Sparkles,
    title: "Express Yourself",
    description: "Use emojis, tags, and codenames to tell your story your way"
  }];
  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };
  return <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center pt-16 pb-8">
        <div className="flex items-center gap-3">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Juice
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft border-0">
          {/* Step 0: Welcome */}
          {step === 0 && <div className="p-8 text-center space-y-6">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Welcome to the Juice App</h2>
                <p className="text-muted-foreground">
                  Share anonymous dating stories, rate experiences, and discover what others are saying about their dating adventures.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => <div key={index} className="text-center space-y-2">
                  <div className="mx-auto w-12 h-12 bg-juice-peach rounded-2xl flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-juice-orange" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>)}
              </div>

              <Button variant="juice" size="lg" onClick={handleNext} className="w-full">
                Get Started
              </Button>
            </div>}

          {/* Step 1: Invite Code */}
          {step === 1 && <div className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  You're Invited! 💌
                </h2>
                <p className="text-muted-foreground">
                  Enter your invite code to join this exclusive community
                </p>
              </div>

              <div className="space-y-4">
                <Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="INVITE-CODE" className="text-center text-lg tracking-wider rounded-2xl border-juice-orange/30 focus:border-juice-orange" maxLength={12} />
                <p className="text-xs text-muted-foreground text-center">
                  Don't have a code? Ask a friend who's already on Juice!
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="juice-outline" onClick={() => setStep(0)} className="flex-1">
                  Back
                </Button>
                <Button variant="juice" onClick={handleNext} disabled={inviteCode.length < 6} className="flex-1">
                  Verify Code
                </Button>
              </div>
            </div>}

          {/* Step 2: Community Guidelines */}
          {step === 2 && <div className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  Community Guidelines 📋
                </h2>
                <p className="text-muted-foreground">
                  Let's keep Juice a safe space for everyone
                </p>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-juice-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Use codenames, initials, or emojis</p>
                    <p className="text-muted-foreground">Never share real names or identifying information</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-juice-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Be respectful and honest</p>
                    <p className="text-muted-foreground">Share authentic experiences without harassment</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-juice-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Report inappropriate content</p>
                    <p className="text-muted-foreground">Help us maintain a safe community</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="juice-outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button variant="juice" onClick={handleNext} className="flex-1">
                  I Agree, Let's Go!
                </Button>
              </div>
            </div>}
        </Card>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center gap-2 pb-8">
        {[0, 1, 2].map(index => <div key={index} className={`w-2 h-2 rounded-full transition-smooth ${index === step ? "bg-juice-orange" : "bg-juice-orange/30"}`} />)}
      </div>
    </div>;
};
export default WelcomeScreen;