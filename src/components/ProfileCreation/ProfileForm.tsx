import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, X } from 'lucide-react';
import { useUsernameValidation } from '@/hooks/useUsernameValidation';
import type { ProfileFormData } from '@/hooks/useProfileForm';

interface ProfileFormProps {
  formData: ProfileFormData;
  onUpdateField: <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => void;
  onUpdateUsername: (value: string) => void;
  onSubmit: () => void;
  isValid: boolean;
  isSubmitting: boolean;
}

export const ProfileForm = ({
  formData,
  onUpdateField,
  onUpdateUsername,
  onSubmit,
  isValid,
  isSubmitting
}: ProfileFormProps) => {
  const { isChecking, isAvailable, getStatusIcon, getStatusText } = useUsernameValidation(formData.username);

  const renderStatusIcon = () => {
    const status = getStatusIcon();
    if (status === 'loading') return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (status === 'available') return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === 'unavailable') return <X className="h-4 w-4 text-destructive" />;
    return null;
  };

  const getStatusColor = () => {
    if (isAvailable === false) return 'text-destructive';
    if (isAvailable === true) return 'text-success';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Anonymous Screen Name</Label>
        <div className="relative">
          <Input
            id="username"
            type="text"
            placeholder="Choose a name other users will see"
            value={formData.username}
            onChange={(e) => onUpdateUsername(e.target.value)}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {renderStatusIcon()}
          </div>
        </div>
        {formData.username && (
          <p className={`text-sm ${getStatusColor()}`}>
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
          value={formData.dateOfBirth}
          onChange={(e) => onUpdateField('dateOfBirth', e.target.value)}
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
          value={formData.city}
          onChange={(e) => onUpdateField('city', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Help others find local connections</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={formData.phoneNumber}
          onChange={(e) => onUpdateField('phoneNumber', e.target.value)}
        />
        <p className="text-xs text-muted-foreground">For account security and recovery purposes only</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="relationshipStatus">Current Relationship Status</Label>
        <Select 
          value={formData.relationshipStatus} 
          onValueChange={(value) => onUpdateField('relationshipStatus', value)}
        >
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
        onClick={onSubmit} 
        disabled={!isValid || isSubmitting || !isAvailable}
        className="w-full"
        aria-label={isSubmitting ? "Creating your profile, please wait" : "Create your profile"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Profile...
          </>
        ) : (
          'Create My Profile'
        )}
      </Button>
    </div>
  );
};