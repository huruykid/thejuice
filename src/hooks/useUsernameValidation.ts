import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProfile } from '@/hooks/useProfile';
import { validateUsername } from '@/lib/security';

export const useUsernameValidation = (username: string) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [lastCheckedUsername, setLastCheckedUsername] = useState('');
  
  const { checkUsernameAvailability } = useProfile();
  const debouncedUsername = useDebounce(username, 500);

  const checkUsername = async (value: string) => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      return;
    }

    // Don't re-check if we already checked this username
    if (value === lastCheckedUsername && isAvailable !== null) {
      return;
    }

    // Validate format first
    if (!validateUsername(value).isValid) {
      setIsAvailable(false);
      setLastCheckedUsername(value);
      return;
    }

    setIsChecking(true);
    try {
      const available = await checkUsernameAvailability(value);
      setIsAvailable(available);
      setLastCheckedUsername(value);
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
    } else {
      setIsAvailable(null);
      setLastCheckedUsername('');
    }
  }, [debouncedUsername]);

  // Reset when username changes (immediate feedback)
  useEffect(() => {
    if (username !== lastCheckedUsername) {
      if (!username || username.length < 3) {
        setIsAvailable(null);
      } else if (!validateUsername(username).isValid) {
        setIsAvailable(false);
      }
    }
  }, [username, lastCheckedUsername]);

  const getStatusIcon = () => {
    if (isChecking) return 'loading';
    if (isAvailable === true) return 'available';
    if (isAvailable === false) return 'unavailable';
    return null;
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    if (isAvailable === true) return 'Available!';
    if (isAvailable === false) return 'Not available';
    return '';
  };

  const recheckUsername = () => {
    setLastCheckedUsername('');
    setIsAvailable(null);
    if (username) {
      checkUsername(username);
    }
  };

  return {
    isChecking,
    isAvailable,
    getStatusIcon,
    getStatusText,
    recheckUsername
  };
};