import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = (userId: string | undefined) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !userId) return;

    const register = async () => {
      const { receive } = await PushNotifications.requestPermissions();
      if (receive === 'granted') {
        await PushNotifications.register();
      }
    };

    // Token received — upsert to Supabase
    const registrationListener = PushNotifications.addListener(
      'registration',
      async (token) => {
        const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
        await supabase
          .from('push_tokens' as any)
          .upsert(
            { user_id: userId, token: token.value, platform, updated_at: new Date().toISOString() },
            { onConflict: 'user_id,token' }
          );
      }
    );

    // Registration error
    const registrationErrorListener = PushNotifications.addListener(
      'registrationError',
      (error) => {
        console.error('Push notification registration error:', error);
      }
    );

    // Foreground notification — show toast
    const foregroundListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        toast(notification.title ?? 'New notification', {
          description: notification.body,
        });
      }
    );

    // User tapped notification — navigate to route
    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        const route = action.notification.data?.route;
        if (route) {
          navigate(route);
        }
      }
    );

    register().catch(console.error);

    return () => {
      // Clean up all listeners on unmount
      PushNotifications.removeAllListeners();
    };
  }, [userId, navigate]);
};
