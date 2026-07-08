import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { isPasswordLeaked } from '@/lib/passwordCheck';
import { useSecurityMonitoring } from './useSecurityMonitoring';
import { useViewAs } from '@/contexts/ViewAsContext';
import { useRealIsAdmin } from './useRealIsAdmin';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { trackFailedLogin, trackLoginPattern } = useSecurityMonitoring(user?.id);
  const { viewAs } = useViewAs();
  const { isAdmin: realIsAdmin } = useRealIsAdmin(user?.id);

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

  const signUp = async (email: string, password: string) => {
    // Leaked-password gate (HIBP k-anonymity; see src/lib/passwordCheck.ts).
    // Server-side enforcement is a Supabase Pro feature — this covers the
    // signup form. Fails open if HIBP is unreachable.
    if (await isPasswordLeaked(password)) {
      return {
        error: new AuthError(
          'That password has appeared in a known data breach — please choose a different one.'
        ),
      };
    }

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
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Do not fail signup if email fails
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Rate limit login attempts. NOTE: the bucket key and the limits are derived
    // SERVER-SIDE (keyed on client IP for login); the args below are ignored by the
    // hardened check_rate_limit and kept only for the RPC signature. Do not rely on
    // them — varying them no longer affects enforcement.
    const { data: rateLimitOk, error: rateLimitErr } = await supabase.rpc('check_rate_limit', {
      p_identifier: email,
      p_action_type: 'login_attempt',
      p_max_attempts: 5,
      p_window_minutes: 15,
      p_block_minutes: 60
    });

    // Fail OPEN: this client-side check is advisory — enforcement is hardened server-side
    // (keyed on client IP). If the RPC itself errors (network blip, function exception),
    // `rateLimitOk` is undefined; do NOT lock the user out of login over an infra hiccup.
    // Only block when the RPC actually ran and explicitly said "not allowed".
    if (!rateLimitErr && rateLimitOk === false) {
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
      trackFailedLogin(email); // trackFailedLogin hashes the email internally
      // Omit raw email from RPC — pass only the error message
      await supabase.rpc('detect_suspicious_activity', {
        p_user_id: null,
        p_activity_type: 'failed_login',
        p_details: { error: error.message }
      });
    }
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    // Clear the React Query cache so a subsequent login as a different user
    // never sees the previous user's data while queries re-fetch.
    queryClient.clear();
    return { error };
  };

  // Apply "View as" override (admins only).
  const effectiveUser = realIsAdmin && viewAs === 'logged_out' ? null : user;
  const effectiveSession = realIsAdmin && viewAs === 'logged_out' ? null : session;

  return {
    user: effectiveUser,
    session: effectiveSession,
    loading,
    signUp,
    signIn,
    signOut
  };
};