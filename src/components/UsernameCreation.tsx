import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User2, Check, X } from "lucide-react";
import { validateUsername } from "@/lib/security";

interface UsernameCreationProps {
  onComplete: () => void;
}

const UsernameCreation = ({ onComplete }: UsernameCreationProps) => {
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const { data, error } = await (supabase as any)
        .rpc('is_username_available', { username: value });
      
      if (error) throw error;
      setIsAvailable(data);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    // Only allow letters, numbers, underscores, and dashes
    const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '');
    setUsername(sanitized);
    
    // Validate client-side first
    const validation = validateUsername(sanitized);
    if (!validation.isValid) {
      setIsAvailable(false);
      return;
    }
    
    // Debounced check
    if (sanitized !== value) return; // Don't check if we had to sanitize
    
    clearTimeout((window as any).usernameTimeout);
    (window as any).usernameTimeout = setTimeout(() => {
      checkUsername(sanitized);
    }, 500);
  };

  const createProfile = async () => {
    // Prevent double-clicking by checking if already creating
    if (isCreating) return;
    
    // Validate username
    const validation = validateUsername(username);
    if (!validation.isValid) {
      toast({
        title: "Invalid username",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }
    
    if (!isAvailable) {
      toast({
        title: "Username not available",
        description: "Please choose a different username.",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // First check if profile already exists
      const { data: existingProfile } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      
      if (existingProfile) {
        // Update existing profile
        const result = await (supabase as any)
          .from('profiles')
          .update({ anonymous_username: username })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Create new profile
        const result = await (supabase as any)
          .from('profiles')
          .insert({
            user_id: user.id,
            anonymous_username: username
          });
        error = result.error;
      }

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Username taken",
            description: "This username is already taken. Please choose another.",
            variant: "destructive"
          });
          setIsAvailable(false);
          return;
        }
        throw error;
      }

      toast({
        title: "Welcome!",
        description: `Your anonymous username "${username}" has been created.`,
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) return <div className="animate-spin w-4 h-4 border-2 border-juice-orange border-t-transparent rounded-full" />;
    if (isAvailable === true) return <Check className="w-4 h-4 text-juice-green" />;
    if (isAvailable === false) return <X className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getStatusText = () => {
    if (isChecking) return "Checking availability...";
    if (isAvailable === true) return "Username is available!";
    if (isAvailable === false) return "Username is taken";
    return "";
  };

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
          We Got the Juice. And so do you.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-soft border-0">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-juice-orange to-juice-pink rounded-full mx-auto flex items-center justify-center">
                <User2 className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Choose Your Anonymous Username
              </h2>
              <p className="text-muted-foreground">
                This will be your identity on Juice. Choose wisely - you can't change it later!
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="YourUsername"
                    className="rounded-2xl border-juice-orange/30 focus:border-juice-orange pr-12"
                    maxLength={20}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getStatusIcon()}
                  </div>
                </div>
                
                {username.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`${
                      isAvailable === true ? 'text-juice-green' : 
                      isAvailable === false ? 'text-red-500' : 
                      'text-muted-foreground'
                    }`}>
                      {getStatusText()}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• 3-20 characters</p>
                <p>• Letters, numbers, underscores, and dashes only</p>
                <p>• Cannot be changed after creation</p>
              </div>

              <Button
                onClick={createProfile}
                disabled={!username || username.length < 3 || isAvailable !== true || isCreating}
                variant="juice"
                size="lg"
                className="w-full"
              >
                {isCreating ? "Creating Profile..." : "Create My Profile"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UsernameCreation;