import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useSecurityMonitoring } from './useSecurityMonitoring';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { trackFailedLogin, trackLoginPattern } = useSecurityMonitoring(user?.id);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, _inviteCode?: string) => {
    // Use a more robust redirect URL that works in all environments
    const redirectUrl = window.location.href.includes('lovableproject.com') 
      ? 'https://da2e9ee2-4548-482f-80e7-6cfedc4bfcb9.lovableproject.com/'
      : `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      }
    });

    // Send welcome email (non-blocking)
    if (!error && data.user) {
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email: data.user.email }
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Do not fail signup if email fails
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Check rate limit for login attempts
    const identifier = `login_${email}_${window.location.hostname}`;
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action_type: 'login_attempt',
      p_max_attempts: 5,
      p_window_minutes: 15,
      p_block_minutes: 60
    });

    if (!rateLimitOk) {
      return { 
        error: new Error('Too many login attempts. Please try again later.') 
      };
    }

    // Track login pattern for security monitoring
    trackLoginPattern(email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Track failed login attempts and detect suspicious activity
    if (error) {
      trackFailedLogin(email);
      await supabase.rpc('detect_suspicious_activity', {
        p_user_id: null,
        p_activity_type: 'failed_login',
        p_details: { email, error: error.message }
      });
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
  };
};