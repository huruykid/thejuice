import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse, authenticateRequest, requireAdmin } from "../_shared/security.ts";
import { emailShell, button, signoff, esc, BRAND } from "../_shared/email.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// CAN-SPAM postal address for the transactional footer.
// Use HTML entities (not raw multibyte chars) so encoding can't mangle them in email clients.
const COMPANY = "Juice &middot; 4460 W Shaw Ave, Fresno, CA 93722";

interface RejectionEmailRequest {
  email: string;
  username?: string;
  // `reason` is accepted for backward compatibility and stored internally by the caller,
  // but is intentionally NOT shown to the user. Reflecting a free-text reviewer note back
  // to a rejected applicant is a discrimination/defamation surface and serves no purpose
  // for the user — the email stays neutral and process-based on purpose.
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return handleCorsPreFlight();

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const adminCheck = await requireAdmin(auth.userId);
    if (adminCheck) return adminCheck;

    const { email, username }: RejectionEmailRequest = await req.json();
    const greeting = username ? `Hey ${esc(username)},` : "Hey,";

    // Pin the font on every text element (not via inheritance) — some clients (Outlook)
    // reset unstyled headings to a serif default, which reads as inconsistent fonts.
    const fam = `font-family:${BRAND.font}`;

    // Neutral, non-judgmental, retry-forward. No identity claims, no guarantee of approval,
    // no echoed reviewer note. This is a transactional account-status message.
    // Non-ASCII punctuation is written as HTML entities (&mdash;) so encoding can't mangle it.
    const body = `
      <h1 style="${fam};font-size:22px;line-height:1.3;margin:0 0 16px;color:${BRAND.ink}">We couldn't approve your verification this time</h1>
      <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 16px;color:${BRAND.ink}">${greeting}</p>
      <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 16px;color:${BRAND.ink}">
        Thanks for applying to Juice. After a manual review, we weren't able to approve your
        verification this time. This isn't a judgment about you &mdash; most often it just means the
        photo wasn't clear enough for us to confirm.
      </p>
      <p style="${fam};font-size:15px;line-height:1.6;margin:0 0 24px;color:${BRAND.ink}">
        You're welcome to try again. Open the app, tap <strong>Resubmit verification</strong>,
        and send a new photo &mdash; a clearer shot usually does it.
      </p>
      <p style="margin:0 0 24px">${button(`${BRAND.appUrl}/app`, "Resubmit verification")}</p>
      <p style="${fam};font-size:14px;line-height:1.6;margin:0 0 8px;color:${BRAND.muted}">
        For the best chance: good lighting, your face clearly visible, no filters or sunglasses,
        and no one else in the frame.
      </p>
      <p style="${fam};font-size:14px;line-height:1.6;margin:0;color:${BRAND.muted}">
        Questions? Visit <a href="${BRAND.appUrl}/support" style="color:${BRAND.muted}">sipjuice.app/support</a>.
      </p>
      ${signoff()}
      <hr style="border:none;border-top:1px solid ${BRAND.hairline};margin:24px 0 12px">
      <p style="${fam};font-size:12px;line-height:1.5;color:${BRAND.faint};margin:0">
        You're receiving this because you applied to verify a Juice account.<br>${COMPANY}
      </p>
    `;

    const emailResponse = await resend.emails.send({
      from: "Juice <noreply@sipjuice.app>",
      to: [email],
      subject: "Your Juice verification: let's try again",
      html: emailShell({
        preheader: "We couldn't approve your verification this time, but you can resubmit in a tap.",
        body,
      }),
    });

    // Resend returns { error } rather than throwing — surface failures instead of
    // silently reporting success.
    if ((emailResponse as any)?.error) {
      console.error("Resend rejected the send:", (emailResponse as any).error);
      return createSecureErrorResponse("Email send failed", 502);
    }

    return createSecureResponse(emailResponse);
  } catch (error: any) {
    console.error("Error in send-rejection-email function:", error);
    return createSecureErrorResponse("Internal server error", 500);
  }
};

serve(handler);