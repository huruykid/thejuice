import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface RateLimitConfig {
  maxAttempts?: number;
  windowMinutes?: number;
  blockMinutes?: number;
}

export const useEnhancedRateLimit = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  const checkRateLimit = useCallback(async (
    identifier: string,
    actionType: string,
    config: RateLimitConfig = {}
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_action_type: actionType,
        p_max_attempts: config.maxAttempts || 5,
        p_window_minutes: config.windowMinutes || 15,
        p_block_minutes: config.blockMinutes || 60
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Fail-closed: deny the action if we cannot verify the rate limit.
        // This prevents abuse during Supabase outages or misconfigurations.
        return false;
      }

      if (!data) {
        setIsBlocked(true);
        toast({
          title: "Rate limit exceeded",
          description: "Too many attempts. Please try again later.",
          variant: "destructive"
        });
        return false;
      }

      setIsBlocked(false);
      return true;
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail-closed: deny the action on unexpected errors.
      return false;
    }
  }, [toast]);

  return {
    checkRateLimit,
    isBlocked
  };
};