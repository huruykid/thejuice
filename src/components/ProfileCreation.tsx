import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { validateUsername } from '@/lib/security';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProfile } from '@/hooks/useProfile';
import OnboardingTips from '@/components/OnboardingTips';

interface ProfileCreationProps {
  onComplete: () => void;
}

const ProfileCreation = ({ onComplete }: ProfileCreationProps) => {
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const { checkUsernameAvailability } = useProfile();
  const debouncedUsername = useDebounce(username, 500);

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const available = await checkUsernameAvailability(value);
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Debounced username checking
  useEffect(() => {
    if (debouncedUsername) {
      checkUsername(debouncedUsername);
    }
  }, [debouncedUsername]);

  const handleUsernameChange = (value: string) => {
    // Clean the input
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    setUsername(cleaned);
    
    // Validate immediately for feedback
    if (!validateUsername(cleaned)) {
      setIsAvailable(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const createProfile = async () => {
    if (!username || !validateUsername(username)) {
      toast.error('Please enter a valid username');
      return;
    }

    if (!isAvailable) {
      toast.error('Please choose an available username');
      return;
    }

    if (!dateOfBirth) {
      toast.error('Please enter your date of birth');
      return;
    }

    const age = calculateAge(dateOfBirth);
    if (age < 18) {
      toast.error('You must be 18 or older to join');
      return;
    }

    if (!city.trim()) {
      toast.error('Please enter your city');
      return;
    }

    if (!relationshipStatus) {
      toast.error('Please select your relationship status');
      return;
    }

    setIsCreating(true);

    try {
      // Check availability one more time
      const stillAvailable = await checkUsernameAvailability(username);
      if (!stillAvailable) {
        toast.error('Username is no longer available. Please choose another.');
        setIsAvailable(false);
        setIsCreating(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('profiles')
          .update({ 
            anonymous_username: username,
            date_of_birth: dateOfBirth,
            city: city.trim(),
            relationship_status: relationshipStatus
          })
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Create new profile
        const result = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            anonymous_username: username,
            date_of_birth: dateOfBirth,
            city: city.trim(),
            relationship_status: relationshipStatus
          });
        error = result.error;
      }

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('Username is already taken');
          setIsAvailable(false);
        } else if (error.message.includes('age_check')) {
          toast.error('You must be 18 or older to join');
        } else {
          toast.error('Failed to create profile. Please try again.');
        }
        return;
      }

      toast.success('Profile created successfully!');
      onComplete();

    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Failed to create profile. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = () => {
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (isAvailable === true) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (isAvailable === false) return <X className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isAvailable === true) return 'Available!';
    if (isAvailable === false) return 'Not available';
    return '';
  };

  const isValid = username && 
    isAvailable && 
    dateOfBirth && 
    city.trim() && 
    relationshipStatus &&
    calculateAge(dateOfBirth) >= 18;

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <img src="/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="Juice" className="h-16 w-16 mx-auto" />
          <div>
            <CardTitle className="text-2xl font-bold">Create Your Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Tell us about yourself to get started sharing and discovering stories
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Anonymous Screen Name</Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="Choose a name other users will see"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getStatusIcon()}
              </div>
            </div>
            {username && (
              <p className={`text-sm ${isAvailable === false ? 'text-red-600' : isAvailable === true ? 'text-green-600' : 'text-muted-foreground'}`}>
                {getStatusText()}
              </p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• 3-20 characters</p>
              <p>• Letters, numbers, underscore, hyphen only</p>
              <p>• Don't use your real name</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">Must be 18 or older</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City You Live In</Label>
            <Input
              id="city"
              type="text"
              placeholder="Los Angeles, CA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Help others find local connections</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationshipStatus">Current Relationship Status</Label>
            <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="talking">Talking to someone</SelectItem>
                <SelectItem value="situationship">In a situationship</SelectItem>
                <SelectItem value="relationship">In a relationship</SelectItem>
                <SelectItem value="complicated">It's complicated</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={createProfile} 
            disabled={!isValid || isCreating}
            className="w-full"
            aria-label={isCreating ? "Creating your profile, please wait" : "Create your profile"}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create My Profile'
            )}
          </Button>
          
          <OnboardingTips step="profile" />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCreation;