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

  const signUp = async (email: string, password: string, inviteCode: string) => {
    // Use a more robust redirect URL that works in all environments
    const redirectUrl = window.location.href.includes('lovableproject.com') 
      ? 'https://da2e9ee2-4548-482f-80e7-6cfedc4bfcb9.lovableproject.com/'
      : `${window.location.origin}/`;
    
    // First validate the invite code
    const { data: inviteData, error: inviteError } = await (supabase as any)
      .from('invite_codes')
      .select('id')
      .eq('code', inviteCode.toUpperCase())
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !inviteData) {
      return { error: { message: 'Invalid or expired invite code' } };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          invite_code: inviteCode.toUpperCase()
        }
      }
    });

    // If signup successful, mark invite as used and send welcome email
    if (!error && data.user) {
      try {
        const { error: useError } = await (supabase as any)
          .rpc('use_invite_code', {
            invite_code: inviteCode.toUpperCase(),
            new_user_id: data.user.id
          });
        
        if (useError) {
          console.error('Failed to process invite code:', useError);
        }

        // Send welcome email
        try {
          await supabase.functions.invoke('send-welcome-email', {
            body: { email: data.user.email }
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail signup if email fails
        }
      } catch (err) {
        console.error('Error processing invite code:', err);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Track login pattern for security monitoring
    trackLoginPattern(email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // Track failed login attempts
    if (error) {
      trackFailedLogin(email);
    }
    
    return { error };
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