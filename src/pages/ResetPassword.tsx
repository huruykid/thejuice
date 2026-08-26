import { useState, useEffect } from "react";
import BrandLockup from "@/components/BrandLockup";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isPasswordLeaked } from "@/lib/passwordCheck";
import { useToast } from "@/hooks/use-toast";

/**
 * Handles the Supabase password-reset magic-link callback.
 * Supabase appends either:
 *   - a `#access_token=...&type=recovery` hash (implicit flow), or
 *   - a `?code=...` query param (PKCE flow)
 * We let the Supabase client auto-exchange the token on mount, then allow
 * the user to set a new password.
 */
const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Wait for Supabase to exchange the token from the URL hash/code.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Same leaked-password gate as signup (HIBP k-anonymity, fails open).
      if (await isPasswordLeaked(password)) {
        toast({
          title: "That password has appeared in a known data breach",
          description: "Please choose a different password.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setDone(true);
        setTimeout(() => navigate("/app"), 2500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <button onClick={() => navigate("/")} className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
          <BrandLockup variant="stacked" size="lg" />
        </button>

        <Card className="w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft border-0">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
              <p className="text-muted-foreground text-sm">
                {done
                  ? "Password updated! Redirecting you in…"
                  : ready
                  ? "Choose a strong new password."
                  : "Verifying your reset link…"}
              </p>
            </div>

            {ready && !done && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    aria-label="New password"
                    className="rounded-2xl border-primary/30 focus:border-primary pr-12"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  aria-label="Confirm new password"
                  className="rounded-2xl border-primary/30 focus:border-primary"
                  required
                  minLength={8}
                />
                <Button type="submit" size="lg" className="w-full h-14 text-base" disabled={loading}>
                  {loading ? "Saving…" : "Update password"}
                </Button>
              </form>
            )}

            {!ready && !done && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
