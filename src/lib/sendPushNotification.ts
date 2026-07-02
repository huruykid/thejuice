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

/**
 * Notify a user their verification was approved. Admin-only — the backend
 * verifies the caller's admin role AND that the approval actually happened
 * before sending.
 */
export async function sendVerificationApprovedNotification(
  userId: string,
): Promise<void> {
  await supabase.functions.invoke("send-push-notification", {
    body: { type: "verification_approved", userId },
  });
}

/**
 * Notify a story author their post was rejected. Admin-only — the backend
 * verifies the caller's admin role AND that the story is actually rejected;
 * the notification body carries the admin-set rejection reason from the DB.
 */
export async function sendPostRejectedNotification(storyId: string): Promise<void> {
  await supabase.functions.invoke("send-push-notification", {
    body: { type: "post_rejected", storyId },
  });
}
