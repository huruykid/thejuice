import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse, authenticateRequest } from '../_shared/security.ts';
import { BRAND, esc, emailShell, button, signoff } from '../_shared/email.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface WelcomeEmailRequest {
  username?: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    const safeName = esc(username ?? "");

    const emailResponse = await resend.emails.send({
      from: "Juice <hey@sipjuice.app>",
      to: [email],
      subject: "welcome to Juice — one step to unlock it",
      html: emailShell({
        preheader: "Verify you're a real guy (about 30 seconds) to read every story — or look someone up first.",
        body: `
          <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
            Welcome to Juice${safeName ? `, ${safeName}` : ""} &mdash; you're signed up.
          </p>
          <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
            One quick step unlocks every story: verify you're a real guy. It takes about 30 seconds,
            and you stay anonymous the whole time. We review each verification by hand, so you'll get
            an email the moment you're approved.
          </p>
          <div style="margin:0 0 24px">${button(`${BRAND.appUrl}/app`, "Get verified &rarr;")}</div>
          <p style="font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0">
            Not ready? You can still look someone up right now and see who's already in here.
          </p>
          ${signoff()}`,
      }),
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return createSecureResponse({ success: true, emailResponse });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return createSecureErrorResponse('Internal server error', 500);
  }
};

serve(handler);
