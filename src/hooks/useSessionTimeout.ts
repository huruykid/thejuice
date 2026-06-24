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

  // Clear timers unconditionally — called on manual sign-out and on unmount.
  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  };

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const resetActivity = () => {
      const now = Date.now();
      // Throttle: only reset if more than 1 minute since last activity.
      if (now - lastActivityRef.current > 60000) {
        resetTimeout();
      }
    };

    events.forEach(event => document.addEventListener(event, resetActivity, true));

    // Initial timeout setup
    resetTimeout();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetActivity, true));
      clearTimers();
    };
  }, [user, timeoutMinutes]);

  // Subscribe to Supabase auth events so timers are cleared immediately on
  // manual sign-out — the component may not unmount right away in an SPA.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearTimers();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return {
    extendSession,
    resetTimeout
  };
};