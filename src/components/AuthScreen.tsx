
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useInvites } from "@/hooks/useInvites";
import { useUserSession } from "@/hooks/useUserSession";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
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
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const { validateInviteCode } = useInvites();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!inviteCode || inviteCode.length < 6) {
          toast({
            title: "Invite code required",
            description: "Please enter a valid invite code to sign up.",
            variant: "destructive"
          });
          return;
        }
        
        // Validate invite code before attempting signup
        const isValidCode = await validateInviteCode(inviteCode);
        if (!isValidCode) {
          toast({
            title: "Invalid invite code",
            description: "This invite code is invalid or has expired.",
            variant: "destructive"
          });
          return;
        }
        
        const result = await signUp(email, password, inviteCode);
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

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      
      // For sign-up, require and validate invite code first
      if (isSignUp) {
        if (!inviteCode || inviteCode.length < 6) {
          toast({
            title: "Invite code required",
            description: "Please enter a valid invite code to sign up.",
            variant: "destructive"
          });
          return;
        }
        
        // Validate invite code before OAuth
        const isValidCode = await validateInviteCode(inviteCode);
        if (!isValidCode) {
          toast({
            title: "Invalid invite code",
            description: "This invite code is invalid or has expired.",
            variant: "destructive"
          });
          return;
        }
        
        // Store invite code for after OAuth redirect
        localStorage.setItem('pending_invite_code', inviteCode);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        toast({
          title: "OAuth Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
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
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center pt-16 pb-8">
        <div className="flex flex-col items-center gap-3">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16" />
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            The Juice App
          </h1>
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          We Got the Juice. Now You Do Too.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft border-0">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignUp ? "Join Juice" : (isReturningUser ? "Welcome Back" : "Welcome to Juice")}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp 
                  ? "Enter your invite code and create your account" 
                  : <>Sign in to share and<br />discover dating stories</>
                }
              </p>
            </div>

            {/* OAuth Sign In Options - Show invite code input first for sign up */}
            {isSignUp && (
              <div>
                <Input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="INVITE-CODE"
                  className="text-center text-lg tracking-wider rounded-2xl border-juice-orange/30 focus:border-juice-orange"
                  maxLength={12}
                  required
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Enter your invite code to continue with social sign-up
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading || (isSignUp && !inviteCode)}
                className="w-full rounded-2xl border-juice-orange/30 hover:border-juice-orange"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn('apple')}
                disabled={loading || (isSignUp && !inviteCode)}
                className="w-full rounded-2xl border-juice-orange/30 hover:border-juice-orange"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Continue with Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-juice-orange/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <Input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="INVITE-CODE"
                    className="text-center text-lg tracking-wider rounded-2xl border-juice-orange/30 focus:border-juice-orange"
                    maxLength={12}
                    required
                  />
                </div>
              )}
              
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
                className="w-full"
                disabled={loading}
              >
                {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setInviteCode("");
                  setEmail("");
                  setPassword("");
                }}
                className="text-juice-orange hover:text-juice-orange/80 hover:bg-transparent"
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : (
                    <span>
                      Need an account?<br />
                      Sign up with invite code
                    </span>
                  )
                }
              </Button>
              
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Don't have an invite code? Ask a friend who's already on Juice!
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;
