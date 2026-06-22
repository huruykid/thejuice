import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export const useSessionTimeout = (timeoutMinutes: number = 30) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    
    if (!user) return;
    
    // Set warning timeout (5 minutes before actual timeout)
    warningRef.current = setTimeout(() => {
      toast({
        title: "Session Warning",
        description: "Your session will expire in 5 minutes due to inactivity.",
        duration: 10000,
      });
    }, (timeoutMinutes - 5) * 60 * 1000);
    
    // Set actual timeout
    timeoutRef.current = setTimeout(async () => {
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        variant: "destructive",
      });
      await signOut();
    }, timeoutMinutes * 60 * 1000);
  };

  const extendSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (!error) {
        resetTimeout();
        toast({
          title: "Session Extended",
          description: "Your session has been extended.",
        });
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetActivity = () => {
      const now = Date.now();
      // Only reset if it's been more than 1 minute since last activity (prevent excessive resets)
      if (now - lastActivityRef.current > 60000) {
        resetTimeout();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, timeoutMinutes]);

  return {
    extendSession,
    resetTimeout
  };
};