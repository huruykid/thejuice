import { supabase } from "@/integrations/supabase/client";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  await supabase.functions.invoke('send-push-notification', {
    body: { userId, title, body, data },
  });
}
