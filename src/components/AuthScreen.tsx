import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen = ({ onAuthSuccess }: AuthScreenProps) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
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
        
        const { error } = await signUp(email, password, inviteCode);
        if (error) {
          if (error.message.includes('already been registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive"
            });
            setIsSignUp(false);
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Check your email",
            description: "Please check your email for a confirmation link.",
          });
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

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
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
          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignUp ? "Join Juice" : "Welcome Back"}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp 
                  ? "Enter your invite code and create your account" 
                  : "Sign in to share and discover dating stories"
                }
              </p>
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