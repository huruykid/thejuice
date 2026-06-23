import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCorsPreFlight,
  createSecureResponse,
  createSecureErrorResponse,
  authenticateRequest,
  requireAdmin,
} from "../_shared/security.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ReqBody {
  userIds?: string[];
}

interface CopyOutput {
  subject: string;
  bodyParagraphs: string[];
}

const FALLBACK: CopyOutput = {
  subject: "Quick favor — repost your Juice story with a photo",
  bodyParagraphs: [
    "We just made photos required on every Juice story. Yours went up before the change, so it's still live — but it'll land harder with a photo attached.",
    "Hop back in and repost it with a pic of the person (or the receipts). Same story, way more impact.",
    "Takes 60 seconds. Thanks for being early to this.",
  ],
};

async function generateCopy(username: string | null): Promise<CopyOutput> {
  if (!LOVABLE_API_KEY) return FALLBACK;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are the UX copywriter for The Juice — an anonymous, men-only social app where users share dating stories. Voice: direct, warm, dry-witty, never salesy, no emojis, no exclamation marks except where natural. Write like a friend texting, not a brand. Short sentences. No corporate filler.",
          },
          {
            role: "user",
            content: `Write an email asking ${username ? `@${username}` : "the user"} to repost their existing Juice story now that we require a photo. Key facts: (1) their old story is still live, (2) we now require at least one photo on new posts, (3) reposting with a photo makes it land harder and helps other men in the community, (4) the CTA is to open the app and repost. Return strict JSON only: {"subject": string (under 60 chars), "bodyParagraphs": string[] (2-3 short paragraphs, no greeting, no signoff)}. No markdown, no commentary.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      console.warn("AI gateway non-OK", res.status, await res.text());
      return FALLBACK;
    }
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return FALLBACK;
    const parsed = JSON.parse(raw) as CopyOutput;
    if (!parsed.subject || !Array.isArray(parsed.bodyParagraphs)) return FALLBACK;
    return parsed;
  } catch (e) {
    console.warn("Copy gen failed:", e);
    return FALLBACK;
  }
}

function renderHtml(username: string | null, copy: CopyOutput): string {
  const greeting = username ? `Hey @${username},` : "Hey,";
  const paragraphs = copy.bodyParagraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;">${p
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</p>`
    )
    .join("");
  return `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
  <body style="margin:0;padding:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #eee;">
          <tr><td style="padding:28px 32px 0 32px;">
            <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#f57c00;">The Juice</div>
            <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#1a1a1a;">A quick ask.</h1>
          </td></tr>
          <tr><td style="padding:20px 32px 0 32px;font-size:15px;line-height:1.6;color:#333;">
            <p style="margin:0 0 16px 0;">${greeting}</p>
            ${paragraphs}
          </td></tr>
          <tr><td style="padding:8px 32px 8px 32px;" align="left">
            <a href="https://sipjuice.app/app" style="display:inline-block;background:#f57c00;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px;">Repost your story</a>
          </td></tr>
          <tr><td style="padding:20px 32px 28px 32px;font-size:12px;line-height:1.55;color:#777;border-top:1px solid #f0f0f0;">
            <p style="margin:16px 0 0 0;">You're getting this because you have a live story on Juice from before we required photos.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return handleCorsPreFlight();

  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;
    const adminCheck = await requireAdmin(auth.userId);
    if (adminCheck) return adminCheck;

    const body: ReqBody = req.body ? await req.json().catch(() => ({})) : {};
    const userIds = Array.isArray(body.userIds) ? body.userIds.filter((x) => typeof x === "string") : [];
    if (userIds.length === 0) return createSecureErrorResponse("userIds required", 400);
    if (userIds.length > 50) return createSecureErrorResponse("Too many recipients (max 50)", 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, anonymous_username")
      .in("user_id", userIds);
    const usernameByUserId = new Map<string, string | null>(
      (profiles ?? []).map((p: any) => [p.user_id, p.anonymous_username ?? null])
    );

    const results: Array<{ userId: string; status: "sent" | "failed"; error?: string }> = [];

    for (const userId of userIds) {
      try {
        const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
        if (userErr || !userRes?.user?.email) {
          results.push({ userId, status: "failed", error: "no email" });
          continue;
        }
        const email = userRes.user.email;
        const username = usernameByUserId.get(userId) ?? null;
        const copy = await generateCopy(username);
        const html = renderHtml(username, copy);

        const send = await resend.emails.send({
          from: "Juice <noreply@sipjuice.app>",
          to: [email],
          subject: copy.subject,
          html,
        });
        if ((send as any)?.error) {
          results.push({ userId, status: "failed", error: String((send as any).error?.message ?? "send failed") });
        } else {
          results.push({ userId, status: "sent" });
          await admin.from("security_audit_logs").insert({
            user_id: auth.userId,
            action: "repost_request_email_sent",
            resource_type: "user",
            resource_id: userId,
            details: { subject: copy.subject },
          });
        }
      } catch (e: any) {
        console.error("send failed for", userId, e);
        results.push({ userId, status: "failed", error: e?.message ?? "unknown" });
      }
    }

    return createSecureResponse({ results });
  } catch (e: any) {
    console.error("send-repost-request-email error:", e);
    return createSecureErrorResponse(e?.message ?? "Internal error", 500);
  }
};

serve(handler);