import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse, authenticateRequest } from '../_shared/security.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmailRequest {
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

    const { username }: WelcomeEmailRequest = await req.json().catch(() => ({}));

    const email = auth.email;
    if (!email) {
      return createSecureErrorResponse('No email associated with account', 400);
    }

    console.log(`Sending welcome email to authenticated user`);

    const safeName = (username ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

    const emailResponse = await resend.emails.send({
      from: "Juice <hey@sipjuice.app>",
      to: [email],
      subject: "you're in. look someone up.",
      html: `
        <style>@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap');</style>
        <div style="display:none;max-height:0;overflow:hidden;opacity:0">Verified, anonymous, in. Here's the first thing most people do &mdash; search a name.</div>
        <div style="max-width:520px;margin:0 auto;font-family:'Barlow',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A0A0A;padding:32px 24px">
          <div style="text-align:center;margin:0 0 28px">
            <img src="https://sipjuice.app/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="The Juice App" width="56" height="56" style="display:inline-block;border:0;margin:0 0 8px">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#0A0A0A">The <span style="color:#F8B23A">Juice</span> App</div>
          </div>
          <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
            ${safeName ? `${safeName}, you` : "You"} made it past the gate &mdash; verified, anonymous, in.
          </p>
          <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
            Here's the thing most people do first: search a name. Someone you matched with, someone a
            friend warned you about, someone you're just curious about. Takes two seconds and no one
            ever knows you looked.
          </p>
          <div style="margin:0 0 24px">
            <a href="https://sipjuice.app/app" style="background:#F8B23A;color:#0A0A0A;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;display:inline-block">Look someone up &rarr;</a>
          </div>
          <p style="font-size:14px;line-height:1.6;color:#737373;margin:0">
            If she's already in here, you'll see it. If she's not&hellip; you might be the one who knows something.
          </p>
          <p style="font-size:13px;color:#9A9A9A;margin:28px 0 0">&mdash; Juice</p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return createSecureResponse({ success: true, emailResponse });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return createSecureErrorResponse('Internal server error', 500);
  }
};

serve(handler);