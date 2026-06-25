import { supabase } from "@/integrations/supabase/client";

/**
 * Ask the backend to send a templated push notification for an event on a story.
 *
 * The recipient (the story owner), the notification title/body, and the
 * deep-link route are all derived server-side from the event — the client
 * cannot target an arbitrary user or inject content. The backend also verifies
 * that the caller actually performed the action.
 */
export async function sendStoryEventNotification(
  type: "reaction" | "comment",
  storyId: string,
): Promise<void> {
  await supabase.functions.invoke("send-push-notification", {
    body: { type, storyId },
  });
}
