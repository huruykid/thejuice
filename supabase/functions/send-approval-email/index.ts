import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse } from '../_shared/security.ts';

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
    const { email, username }: ApprovalEmailRequest = await req.json();

    console.log(`Sending approval email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "SipJuice <noreply@sipjuice.app>",
      to: [email],
      subject: "🎉 Welcome to Juice - Your Account is Approved!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Juice!</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; color: white; }
            .content { padding: 40px 30px; }
            .emoji { font-size: 48px; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; }
            .subtitle { font-size: 16px; opacity: 0.9; margin: 0; }
            .welcome-text { font-size: 18px; margin-bottom: 30px; color: #555; }
            .feature-list { list-style: none; padding: 0; margin: 30px 0; }
            .feature-item { display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #f8f9ff; border-radius: 10px; }
            .feature-emoji { font-size: 24px; margin-right: 15px; }
            .cta-button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .footer { background: #f8f9ff; padding: 30px; text-align: center; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="emoji">🧃</div>
              <h1 class="title">Welcome to Juice!</h1>
              <p class="subtitle">Your account has been approved</p>
            </div>
            
            <div class="content">
              <p class="welcome-text">
                Hey ${username || 'there'}! 🎉 Great news - your account has been approved and you're now part of the Juice community!
              </p>
              
              <h3>What you can do now:</h3>
              <ul class="feature-list">
                <li class="feature-item">
                  <span class="feature-emoji">💭</span>
                  <div>
                    <strong>Share Your Stories</strong><br>
                    Tell your dating experiences anonymously and help others learn
                  </div>
                </li>
                <li class="feature-item">
                  <span class="feature-emoji">🔍</span>
                  <div>
                    <strong>Discover Real Experiences</strong><br>
                    Read authentic stories from people in your area
                  </div>
                </li>
                <li class="feature-item">
                  <span class="feature-emoji">🤝</span>
                  <div>
                    <strong>Connect Safely</strong><br>
                    Share and discover while maintaining your privacy
                  </div>
                </li>
              </ul>

              <div style="text-align: center;">
                <a href="https://sipjuice.app" class="cta-button">
                  🍊 Start Sharing Your Stories
                </a>
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Remember to keep stories anonymous and respect our community guidelines. 
                Ready to spill some tea? ☕✨
              </p>
            </div>

            <div class="footer">
              <p>
                <strong>Juice App</strong><br>
                The anonymous space for real dating stories
              </p>
              <p style="font-size: 12px; margin-top: 20px;">
                Questions? Just reply to this email - we'd love to hear from you!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return createSecureResponse(emailResponse);
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    return createSecureErrorResponse(error.message, 500);
  }
};

serve(handler);