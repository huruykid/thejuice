import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse, authenticateRequest, requireAdmin } from '../_shared/security.ts';
import { esc } from '../_shared/email.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ApprovalEmailRequest {
  email: string;
  username?: string;
  /**
   * Subject names of reviews this member wrote BEFORE verifying. They were held
   * pending on the selfie; now that it's approved they're one moderation pass
   * from live. Naming them is the strongest come-back hook we have.
   */
  heldSubjects?: string[];
}

const APP_URL = "https://sipjuice.app";

/** Deep link to the lookup for a name — the same link the search-miss nudge uses. */
const lookupLink = (name: string) => `${APP_URL}/app?q=${encodeURIComponent(name)}`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight();
  }

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const adminCheck = await requireAdmin(auth.userId);
    if (adminCheck) return adminCheck;

    const body: ApprovalEmailRequest = await req.json();
    const { email, username } = body;
    // Defensive: only strings, trimmed, capped — this lands in an email body.
    const heldSubjects = (Array.isArray(body.heldSubjects) ? body.heldSubjects : [])
      .filter((n): n is string => typeof n === "string")
      .map((n) => n.trim())
      .filter((n) => n.length > 0 && n.length <= 80)
      .slice(0, 5);

    console.log(`Sending approval email to: ${email} (held reviews: ${heldSubjects.length})`);

    const greeting = username ? `Hey ${esc(username)},` : "Hey,";
    const first = heldSubjects[0];
    const subject = first
      ? `You're in — your review of ${first} goes live next`
      : "You're in — look her up";

    // Two versions of the middle: "your review is about to publish" vs. the
    // generic "look someone up / be the first". No more "post one story to
    // unlock the feed" — that gate was removed in June and the copy outlived it.
    const heldBlock = first
      ? `
                        <p style="margin:0 0 16px 0;">
                          <strong>Your review${heldSubjects.length > 1 ? "s" : ""} of ${heldSubjects.map(esc).join(", ")}</strong>
                          ${heldSubjects.length > 1 ? "were" : "was"} saved while you waited. Now that you're verified,
                          ${heldSubjects.length > 1 ? "they go" : "it goes"} through one quick moderation check and then
                          ${heldSubjects.length > 1 ? "they're" : "it's"} live for every other member who looks her up.
                        </p>`
      : `
                        <p style="margin:0 0 16px 0;">
                          Every story is unlocked. Look up a name before the date — and if nobody has
                          passed on the Juice about her yet, be the first.
                        </p>`;
    const ctaHref = first ? lookupLink(first) : `${APP_URL}/app`;
    const ctaLabel = first ? `See your review of ${esc(first)}` : "Look her up";

    const emailResponse = await resend.emails.send({
      from: "Juice <noreply@sipjuice.app>",
      to: [email],
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>You're in</title>
          </head>
          <body style="margin:0;padding:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
                    <tr>
                      <td style="padding:28px 32px 0 32px;">
                        <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#f57c00;">The Juice</div>
                        <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#1a1a1a;">You're in.</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 32px 0 32px;font-size:15px;line-height:1.55;color:#333;">
                        <p style="margin:0 0 16px 0;">${greeting}</p>
                        <p style="margin:0 0 16px 0;">Your selfie checked out. Welcome to the inside.</p>${heldBlock}
                        <p style="margin:0 0 24px 0;color:#555;">
                          Posts are checked by a person before they go live — usually the same day.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 32px 8px 32px;" align="left">
                        <a href="${ctaHref}"
                           style="display:inline-block;background:#f57c00;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
                          ${ctaLabel}
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 32px 28px 32px;font-size:13px;line-height:1.55;color:#666;border-top:1px solid #f0f0f0;margin-top:24px;">
                        <p style="margin:16px 0 0 0;">
                          Keep it anonymous. Frame anything unverified as "allegedly."
                          Don't name people in ways that identify them. That's how we keep this place useful — and safe.
                        </p>
                      </td>
                    </tr>
                  </table>
                  <p style="font-size:12px;color:#999;margin:16px 0 0 0;">The Juice · sipjuice.app</p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return createSecureResponse(emailResponse);
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    return createSecureErrorResponse('Internal server error', 500);
  }
};

serve(handler);