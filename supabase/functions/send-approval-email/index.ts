import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse, authenticateRequest, requireAdmin } from '../_shared/security.ts';
import { esc } from '../_shared/email.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ApprovalEmailRequest {
  email: string;
  username?: string;
}

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

    const { email, username }: ApprovalEmailRequest = await req.json();

    console.log(`Sending approval email to: ${email}`);

    const greeting = username ? `Hey ${esc(username)},` : "Hey,";
    const emailResponse = await resend.emails.send({
      from: "Juice <noreply@sipjuice.app>",
      to: [email],
      subject: "You're in — post one story to unlock the Juice feed",
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
                        <p style="margin:0 0 16px 0;">Your account is approved. Welcome to the inside.</p>
                        <p style="margin:0 0 16px 0;">
                          <strong>One thing first:</strong> to unlock the full community feed, post at least one story.
                          Until you do, you'll see our editorial seed posts only.
                        </p>
                        <p style="margin:0 0 24px 0;color:#555;">
                          Every post is reviewed by us before it goes live — usually within 24 hours.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 32px 8px 32px;" align="left">
                        <a href="https://sipjuice.app/app"
                           style="display:inline-block;background:#f57c00;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">
                          Post your first story
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