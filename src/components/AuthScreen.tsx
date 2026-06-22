
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

import { useUserSession } from "@/hooks/useUserSession";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SelfieCapture from './SelfieCapture';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen = ({ onAuthSuccess }: AuthScreenProps) => {
  const { isReturningUser } = useUserSession();
  const [isSignUp, setIsSignUp] = useState(!isReturningUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (result.error) {
          if (result.error.message.includes('already been registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive"
            });
            setIsSignUp(false);
          } else {
            toast({
              title: "Sign up failed",
              description: result.error.message,
              variant: "destructive"
            });
          }
        } else {
          // For now, proceed to onboarding since we disabled email verification
          onAuthSuccess();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          onAuthSuccess();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSelfieComplete = (success: boolean) => {
    setShowSelfieCapture(false);
    if (success) {
      onAuthSuccess();
    } else {
      toast({
        title: "Verification Required",
        description: "Please complete the selfie verification to continue.",
        variant: "destructive",
      });
    }
  };

  // Show selfie capture if user just signed up
  if (showSelfieCapture && pendingUserId) {
    return <SelfieCapture userId={pendingUserId} onComplete={handleSelfieComplete} />;
  }

  return (
    <div className="relative min-h-screen bg-gradient-soft flex items-center justify-center px-4 py-8 sm:py-12">
      {/* Desktop top bar */}
      <header className="hidden sm:flex absolute top-0 left-0 right-0 items-center justify-between px-6 lg:px-10 py-5">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          aria-label="Juice home"
        >
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-8 w-8" />
          <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
            The Juice App
          </span>
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </button>
      </header>

      {/* Mobile back chevron */}
      <button
        onClick={() => navigate("/")}
        className="sm:hidden absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Back to landing"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="w-full max-w-md flex flex-col items-center gap-6 sm:gap-8">
        {/* Hero */}
        <button
          onClick={() => navigate("/")}
          className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-14 w-14 sm:h-16 sm:w-16" />
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            The Juice App
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            We Got the Juice. Now You Do Too.
          </p>
        </button>

        <Card className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft border-0">
          <div className="p-6 sm:p-8 space-y-6">
            {/* Segmented tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-full">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setPassword(""); }}
                className={`py-2 text-sm font-semibold rounded-full transition-colors ${
                  !isSignUp ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setPassword(""); }}
                className={`py-2 text-sm font-semibold rounded-full transition-colors ${
                  isSignUp ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Create account
              </button>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignUp ? "Join Juice" : (isReturningUser ? "Welcome Back" : "Welcome to Juice")}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp
                  ? "Create your account"
                  : "Sign in to share and discover dating stories"}
              </p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="rounded-2xl border-juice-orange/30 focus:border-juice-orange"
                  required
                />
              </div>
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="rounded-2xl border-juice-orange/30 focus:border-juice-orange pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <Button
                type="submit"
                variant="juice"
                size="lg"
                className="w-full h-14 text-base"
                disabled={loading}
              >
                {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </form>

          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;
