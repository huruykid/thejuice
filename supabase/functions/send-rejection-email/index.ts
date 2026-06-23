import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse, authenticateRequest, requireAdmin } from "../_shared/security.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface RejectionEmailRequest {
  email: string;
  username?: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return handleCorsPreFlight();

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const adminCheck = await requireAdmin(auth.userId);
    if (adminCheck) return adminCheck;

    const { email, username, reason }: RejectionEmailRequest = await req.json();
    const greeting = username ? `Hey ${username},` : "Hey,";
    const reasonBlock = reason
      ? `<p style="margin:0 0 16px 0;"><strong>Reviewer note:</strong> ${reason}</p>`
      : "";

    const emailResponse = await resend.emails.send({
      from: "Juice <noreply@sipjuice.app>",
      to: [email],
      subject: "Your Juice verification needs another look",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
              <tr><td align="center">
                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
                  <tr><td style="padding:28px 32px 0 32px;">
                    <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#f57c00;">The Juice</div>
                    <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.25;color:#1a1a1a;">We couldn't approve your verification yet.</h1>
                  </td></tr>
                  <tr><td style="padding:20px 32px 0 32px;font-size:15px;line-height:1.55;color:#333;">
                    <p style="margin:0 0 16px 0;">${greeting}</p>
                    <p style="margin:0 0 16px 0;">Thanks for applying to The Juice. After review, we weren't able to approve this verification submission.</p>
                    ${reasonBlock}
                    <p style="margin:0 0 16px 0;">You can resubmit a new selfie from inside the app — just open the app and tap <strong>Resubmit verification</strong>.</p>
                  </td></tr>
                  <tr><td style="padding:0 32px 8px 32px;" align="left">
                    <a href="https://sipjuice.app/app" style="display:inline-block;background:#f57c00;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Resubmit verification</a>
                  </td></tr>
                  <tr><td style="padding:20px 32px 28px 32px;font-size:13px;line-height:1.55;color:#666;border-top:1px solid #f0f0f0;">
                    <p style="margin:16px 0 0 0;">Tips for a clean selfie: good lighting, face clearly visible, no filters or sunglasses, no other people in frame.</p>
                  </td></tr>
                </table>
                <p style="font-size:12px;color:#999;margin:16px 0 0 0;">The Juice · sipjuice.app</p>
              </td></tr>
            </table>
          </body>
        </html>
      `,
    });

    return createSecureResponse(emailResponse);
  } catch (error: any) {
    console.error("Error in send-rejection-email function:", error);
    return createSecureErrorResponse("Internal server error", 500);
  }
};

serve(handler);