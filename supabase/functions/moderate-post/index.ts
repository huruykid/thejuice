// Approve or reject stories AND tell the author — in one admin-authenticated,
// service-role call.
//
// Why this exists as a function rather than a client-side update + a separate
// "send the email" invoke: the notification has to survive the admin closing
// the tab. The previous rejection path fired a fire-and-forget push from the
// browser, and bulk actions fanned out N unawaited requests; a bulk approve of
// 20 posts was 20 chances to drop a notice on the floor. Here the update and
// the send happen server-side in the same request, and the response reports
// exactly who was emailed — so the admin UI can stop claiming "author notified"
// when nobody was.
//
// Push stays a separate, additive channel (see send-push-notification); there
// are currently zero registered push tokens, so email is the only one that
// actually reaches anyone.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import {
  handleCorsPreFlight,
  createSecureResponse,
  createSecureErrorResponse,
  authenticateRequest,
  requireAdmin,
} from "../_shared/security.ts";
import { emailShell, button, signoff, esc, BRAND } from "../_shared/email.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CAN-SPAM postal address for the transactional footer.
const COMPANY = "Juice &middot; 4460 W Shaw Ave, Fresno, CA 93722";

/** One admin action shouldn't be able to fan out an unbounded email blast. */
const MAX_IDS = 100;

type Action = "approve" | "reject";

interface ModeratePostRequest {
  action: Action;
  ids: string[];
  /** Required on reject. One of the fixed labels in AdminPosts' REJECTION_REASONS. */
  reasonLabel?: string;
}

interface StoryRow {
  id: string;
  user_id: string | null;
  status: string;
  content: string;
  submitted_anonymously: boolean;
}

/** Enough of the post for the author to recognize which one this is about. */
const snippet = (content: string) =>
  esc(content.length > 120 ? `${content.slice(0, 120).trimEnd()}…` : content);

const fam = `font-family:${BRAND.font}`;

const approvedEmail = (content: string) => ({
  subject: "Your story is live on Juice",
  preheader: "It passed review — it's in the feed now.",
  body: `
    <h1 style="${fam};font-size:22px;line-height:1.3;margin:0 0 16px;color:${BRAND.ink}">Your story is live</h1>
    <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 16px;color:${BRAND.ink}">
      A human read it, and it's approved. It's in the feed now, and it'll come up when
      another member looks up the same name.
    </p>
    <blockquote style="${fam};font-size:14px;line-height:1.6;margin:0 0 24px;padding:12px 16px;border-left:3px solid ${BRAND.hairline};color:${BRAND.muted}">
      ${snippet(content)}
    </blockquote>
    <p style="margin:0 0 24px">${button(`${BRAND.appUrl}/app`, "See it in the feed")}</p>
    <p style="${fam};font-size:14px;line-height:1.6;margin:0;color:${BRAND.muted}">
      You stay anonymous &mdash; members see your codename, never your name or email.
    </p>
    ${signoff()}
    <hr style="border:none;border-top:1px solid ${BRAND.hairline};margin:24px 0 12px">
    <p style="${fam};font-size:12px;line-height:1.5;color:${BRAND.faint};margin:0">
      You're receiving this because you posted a story on Juice.<br>${COMPANY}
    </p>
  `,
});

const rejectedEmail = (content: string, reasonLabel: string) => ({
  subject: "About the story you submitted",
  preheader: "We couldn't publish this one — here's why, and what to do next.",
  body: `
    <h1 style="${fam};font-size:22px;line-height:1.3;margin:0 0 16px;color:${BRAND.ink}">We couldn't publish this one</h1>
    <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 16px;color:${BRAND.ink}">
      Thanks for posting. After review, we weren't able to publish this story.
    </p>
    <blockquote style="${fam};font-size:14px;line-height:1.6;margin:0 0 16px;padding:12px 16px;border-left:3px solid ${BRAND.hairline};color:${BRAND.muted}">
      ${snippet(content)}
    </blockquote>
    <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 24px;color:${BRAND.ink}">
      <strong>Reason:</strong> ${esc(reasonLabel)}
    </p>
    <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 24px;color:${BRAND.ink}">
      This isn't a strike against your account &mdash; most posts we turn down just need a
      rewrite. Keep it anonymous, frame anything unverified as "allegedly," and don't name
      people in ways that identify them.
    </p>
    <p style="margin:0 0 24px">${button(`${BRAND.appUrl}/app`, "Post another story")}</p>
    ${signoff()}
    <hr style="border:none;border-top:1px solid ${BRAND.hairline};margin:24px 0 12px">
    <p style="${fam};font-size:12px;line-height:1.5;color:${BRAND.faint};margin:0">
      You're receiving this because you posted a story on Juice.<br>${COMPANY}
    </p>
  `,
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return handleCorsPreFlight();

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const adminCheck = await requireAdmin(auth.userId);
    if (adminCheck) return adminCheck;

    const { action, ids, reasonLabel }: ModeratePostRequest = await req.json();

    if (action !== "approve" && action !== "reject") {
      return createSecureErrorResponse("action must be 'approve' or 'reject'", 400);
    }
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
      return createSecureErrorResponse("ids must be a non-empty array of story ids", 400);
    }
    if (ids.length > MAX_IDS) {
      return createSecureErrorResponse(`No more than ${MAX_IDS} posts per request`, 400);
    }
    if (action === "reject" && !reasonLabel) {
      return createSecureErrorResponse("reasonLabel is required when rejecting", 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: rows, error: fetchError } = await supabase
      .from("stories")
      .select("id, user_id, status, content, submitted_anonymously")
      .in("id", ids);

    if (fetchError) {
      console.error("Failed to load stories:", fetchError);
      return createSecureErrorResponse("Failed to load stories", 500);
    }
    if (!rows || rows.length === 0) {
      return createSecureErrorResponse("No matching stories", 404);
    }

    const targetStatus = action === "approve" ? "approved" : "rejected";

    // Only rows actually changing state earn an email. Re-approving something
    // already approved (a double-click, a re-run of a bulk action) must not
    // send the author a second "your story is live".
    const changing = (rows as StoryRow[]).filter((r) => r.status !== targetStatus);
    const changingIds = changing.map((r) => r.id);

    if (changingIds.length > 0) {
      const patch =
        action === "approve"
          ? {
              status: "approved",
              approved_at: new Date().toISOString(),
              approved_by: auth.userId,
              rejection_reason: null,
              rejected_at: null,
            }
          : {
              status: "rejected",
              rejection_reason: reasonLabel,
              rejected_at: new Date().toISOString(),
            };

      const { error: updateError } = await supabase
        .from("stories")
        .update(patch)
        .in("id", changingIds);

      if (updateError) {
        console.error("Failed to update stories:", updateError);
        return createSecureErrorResponse("Failed to update stories", 500);
      }
    }

    // Who can be reached: a real account behind the post, and no standing
    // opt-out. Anonymous submissions have no author to write to by design.
    const notifiable = changing.filter((r) => r.user_id && !r.submitted_anonymously);
    const skippedAnonymous = changing.length - notifiable.length;

    let optedOut = new Set<string>();
    if (notifiable.length > 0) {
      const { data: outs } = await supabase
        .from("email_optouts")
        .select("user_id")
        .in("user_id", notifiable.map((r) => r.user_id));
      optedOut = new Set((outs ?? []).map((o: { user_id: string }) => o.user_id));
    }

    let emailed = 0;
    let skippedOptout = 0;
    let skippedNoEmail = 0;
    const failures: string[] = [];

    for (const row of notifiable) {
      const userId = row.user_id as string;
      if (optedOut.has(userId)) {
        skippedOptout++;
        continue;
      }

      try {
        const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(userId);
        const to = authUser?.user?.email;
        if (userError || !to) {
          skippedNoEmail++;
          continue;
        }

        const tpl =
          action === "approve"
            ? approvedEmail(row.content)
            : rejectedEmail(row.content, reasonLabel as string);

        const sendResult = await resend.emails.send({
          from: "Juice <noreply@sipjuice.app>",
          to: [to],
          subject: tpl.subject,
          html: emailShell({ preheader: tpl.preheader, body: tpl.body }),
        });

        // Resend reports failures in the payload rather than throwing.
        if ((sendResult as { error?: unknown })?.error) {
          console.error(`Resend rejected the send for story ${row.id}:`, (sendResult as { error?: unknown }).error);
          failures.push(row.id);
          continue;
        }

        emailed++;

        // Mirrors verify_nudge_emailed / search_miss_emailed so post-review
        // notices show up in the same analytics table as every other send.
        await supabase.from("analytics_events").insert({
          user_id: userId,
          event: "post_status_emailed",
          props: { story_id: row.id, action },
        });
      } catch (err) {
        console.error(`Failed to notify author of story ${row.id}:`, err);
        failures.push(row.id);
      }
    }

    // Admin read of member emails — same audit trail as get-user-email.
    // try/catch, not .catch(): a PostgrestBuilder is only a thenable, so
    // calling .catch() on it throws — and throwing here would report a 500 for
    // moderation that already applied and emails that already went out.
    if (notifiable.length > 0) {
      try {
        await supabase.rpc("log_security_event", {
          p_user_id: auth.userId,
          p_action: "post_moderation_email",
          p_resource_type: "story",
          p_resource_id: changingIds[0],
          p_details: { action, count: changingIds.length, emailed },
        });
      } catch (e) {
        console.error("Failed to log security event:", e);
      }
    }

    return createSecureResponse({
      updated: changingIds.length,
      unchanged: rows.length - changingIds.length,
      emailed,
      skippedAnonymous,
      skippedOptout,
      skippedNoEmail,
      failed: failures,
    });
  } catch (error) {
    console.error("Error in moderate-post function:", error);
    return createSecureErrorResponse("Internal server error", 500);
  }
};

serve(handler);
