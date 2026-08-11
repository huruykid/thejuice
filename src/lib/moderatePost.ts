import { supabase } from "@/integrations/supabase/client";
import {
  MODERATION_BATCH_SIZE,
  mergeModerationResults,
  type ModerationAction,
  type ModerationResult,
} from "@/lib/moderationCopy";

/**
 * Client side of the `moderate-post` edge function: approve or reject stories
 * and email their authors in one server-side call.
 *
 * The admin UI must not update `stories` directly — doing so is what left
 * authors uninformed. Status changes go through here so the notification is
 * part of the same request.
 */
export async function moderatePosts(
  action: ModerationAction,
  ids: string[],
  reasonLabel?: string
): Promise<ModerationResult> {
  const results: ModerationResult[] = [];

  // Sequential, not parallel: each batch sends real email, and a queue-clearing
  // bulk action shouldn't open a dozen concurrent Resend fan-outs.
  for (let i = 0; i < ids.length; i += MODERATION_BATCH_SIZE) {
    const batch = ids.slice(i, i + MODERATION_BATCH_SIZE);
    const { data, error } = await supabase.functions.invoke("moderate-post", {
      body: { action, ids: batch, reasonLabel },
    });
    if (error) throw error;
    results.push(data as ModerationResult);
  }

  return mergeModerationResults(results);
}

export { describeModeration } from "@/lib/moderationCopy";
export type { ModerationAction, ModerationResult } from "@/lib/moderationCopy";
