
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

import { useUserSession } from "@/hooks/useUserSession";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { track } from "@/lib/analytics";
import BrandLockup from "@/components/BrandLockup";
import SelfieCapture from './RefactoredSelfieCapture';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen = ({ onAuthSuccess }: AuthScreenProps) => {
  const { isReturningUser } = useUserSession();
  // Respect an explicit intent from the entry point: "/app?mode=login" opens the sign-in view,
  // "?mode=signup" opens sign-up. Otherwise fall back to returning-user heuristic.
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const [isSignUp, setIsSignUp] = useState(
    modeParam === "login" ? false : modeParam === "signup" ? true : !isReturningUser
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSelfieCapture, setShowSelfieCapture] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const { signIn, signUp, user } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp && !agreed) {
      toast({
        title: "One more thing",
        description: "You must confirm you're 18+ and agree to the Terms & Community Guidelines.",
        variant: "destructive",
      });
      return;
    }

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
          // Activation signal: new account created.
          void track("signup");
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setResetSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      // Land authenticated users straight in the app; Supabase routes them through
      // verification from there. The origin + /app must be in Supabase's Redirect URLs.
      const redirectUrl = window.location.href.includes('lovableproject.com')
        ? 'https://da2e9ee2-4548-482f-80e7-6cfedc4bfcb9.lovableproject.com/app'
        : `${window.location.origin}/app`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) {
        toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
        setLoading(false);
      }
      // On success the browser redirects to Google — no further code runs here.
    } catch (_) {
      toast({ title: 'Error', description: 'Could not start Google sign-in.', variant: 'destructive' });
      setLoading(false);
    }
  };

  // Show selfie capture if user just signed up
  if (showSelfieCapture && pendingUserId) {
    return <SelfieCapture userId={pendingUserId} onComplete={handleSelfieComplete} />;
  }

  if (showForgotPassword) {
    return (
      <div className="relative min-h-screen bg-gradient-soft flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <button onClick={() => navigate("/")} className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
            <BrandLockup variant="stacked" size="lg" />
          </button>
          <Card className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft border-0">
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Reset password</h2>
                <p className="text-muted-foreground text-sm">
                  {resetSent
                    ? "Check your email — we've sent a reset link."
                    : "Enter your email and we'll send you a link to reset your password."}
                </p>
              </div>
              {!resetSent && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="Email"
                    aria-label="Email address"
                    className="rounded-2xl border-primary/30 focus:border-primary"
                    required
                  />
                  <Button type="submit" variant="juice" size="lg" className="w-full h-14 text-base" disabled={loading}>
                    {loading ? "Sending…" : "Send reset link"}
                  </Button>
                </form>
              )}
              <button
                onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
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
          <BrandLockup variant="inline" size="sm" />
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
          <BrandLockup variant="stacked" size="lg" />
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

            {/* Google OAuth — lead with the lowest-friction path */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full h-14 text-base rounded-2xl bg-white hover:bg-muted/50 border-border gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
                <span className="block text-foreground/80 font-medium mb-0.5">
                  Google is only for sign-in — we never post anything or show your name.
                </span>
                By continuing you confirm you're 18 or older and agree to the{" "}
                <Link to="/terms" target="_blank" className="text-primary underline">
                  Terms &amp; Community Guidelines
                </Link>.
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  aria-label="Email address"
                  className="rounded-2xl border-primary/30 focus:border-primary"
                  required
                />
              </div>
              
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  className="rounded-2xl border-primary/30 focus:border-primary pr-12"
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

              {isSignUp && (
                <label className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>
                    I confirm I'm 18 or older and agree to the{" "}
                    <Link to="/terms" target="_blank" className="text-primary underline">
                      Terms &amp; Community Guidelines
                    </Link>.
                  </span>
                </label>
              )}

              <Button
                type="submit"
                variant="juice"
                size="lg"
                className="w-full h-14 text-base"
                disabled={loading || (isSignUp && !agreed)}
              >
                {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
              </Button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                >
                  Forgot password?
                </button>
              )}
            </form>

          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthScreen;
