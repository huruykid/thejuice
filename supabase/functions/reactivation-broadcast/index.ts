import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// One-time reactivation broadcast to existing users: "come look someone up."
// Marketing email, so it is CAN-SPAM compliant — visible unsubscribe link, List-Unsubscribe
// header, and a postal address (from the COMPANY_ADDRESS secret). Excludes anyone who has
// opted out and anyone already emailed (tracked via analytics_events 'reactivation_emailed'),
// so batches are idempotent and resumable.
//
// Auth: secret-gated (verify_jwt off). Trigger one-off via pg_net from SQL.
// Body: { test_email?: string }  -> sends a single sample to that address only.
//       { page?: number, per_page?: number } -> sends one batch of real users.
const BROADCAST_SECRET = "brd_9pL3xV6mWq2Rt8Bz5Nv7Lc4Hd0Fg1Js";
const UNSUB_SECRET = "uns_5tH8aZ2qWp7Rx4Bz9Nv3Lc6Hd1Fg0Js"; // must match email-unsubscribe
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Juice <hey@sipjuice.app>";
const APP_URL = "https://sipjuice.app";
const SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") ?? "Juice &middot; 4460 W Shaw Ave, Fresno, CA 93722";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(UNSUB_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Brand tokens (mirrors src/index.css): amber primary #F8B23A with near-black text,
// Barlow type with system fallback, 8px radius, hairline #DBDBDB border.
const FONT = `"Barlow",-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const emailHtml = (unsubUrl: string) => `
  <style>@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap');</style>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">You signed up but haven't looked anyone up yet. Two seconds, fully anonymous.</div>
  <div style="max-width:520px;margin:0 auto;font-family:${FONT};color:#0A0A0A;padding:32px 24px">
    <div style="text-align:center;margin:0 0 28px">
      <img src="${APP_URL}/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="The Juice App" width="56" height="56" style="display:inline-block;border:0;margin:0 0 8px">
      <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#0A0A0A">The <span style="color:#F8B23A">Juice</span> App</div>
    </div>
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      You signed up for Juice &mdash; but you haven't looked anyone up yet.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      That's the whole point. Search a name: someone you matched with, someone a friend warned
      you about, someone you're just curious about. Two seconds, and no one ever knows you looked.
    </p>
    <div style="margin:0 0 24px">
      <a href="${APP_URL}/app" style="background:#F8B23A;color:#0A0A0A;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;display:inline-block">Look someone up &rarr;</a>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#737373;margin:0">
      If she's already in here, you'll see it. If she's not&hellip; you might be the one who knows something.
    </p>
    <p style="font-size:13px;color:#9A9A9A;margin:28px 0 0">&mdash; Juice</p>
    <hr style="border:none;border-top:1px solid #DBDBDB;margin:24px 0 12px">
    <p style="font-size:12px;line-height:1.5;color:#9A9A9A;margin:0">
      You're receiving this because you created a Juice account.
      <a href="${unsubUrl}" style="color:#737373">Unsubscribe</a>.<br>
      ${COMPANY_ADDRESS}
    </p>
  </div>`;

async function sendTo(email: string, uid: string) {
  const token = await sign(uid);
  const unsubUrl = `${SUPA_URL}/functions/v1/email-unsubscribe?u=${encodeURIComponent(uid)}&t=${token}`;
  await resend.emails.send({
    from: FROM,
    to: [email],
    subject: "who are you curious about?",
    html: emailHtml(unsubUrl),
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

Deno.serve(async (req) => {
  if (req.headers.get("x-broadcast-secret") !== BROADCAST_SECRET) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const supabase = createClient(SUPA_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  // Test mode: one sample to a single address, no DB writes.
  if (body.test_email) {
    try {
      await sendTo(body.test_email, "test-preview-user");
      return new Response(JSON.stringify({ test: true, sent_to: body.test_email }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ test: true, error: String(e) }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Real batch.
  const page = Number(body.page ?? 1);
  const perPage = Number(body.per_page ?? 100);

  const { data: list, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
  const users = (list?.users ?? []).filter((u) => !!u.email);
  const ids = users.map((u) => u.id);

  const [{ data: outs }, { data: sentRows }] = await Promise.all([
    supabase.from("email_optouts").select("user_id").in("user_id", ids),
    supabase.from("analytics_events").select("user_id").eq("event", "reactivation_emailed").in("user_id", ids),
  ]);
  const skip = new Set<string>([
    ...(outs ?? []).map((o: any) => o.user_id),
    ...(sentRows ?? []).map((s: any) => s.user_id),
  ]);

  let sent = 0;
  const errors: string[] = [];
  for (const u of users) {
    if (skip.has(u.id)) continue;
    try {
      await sendTo(u.email!, u.id);
      await supabase.from("analytics_events").insert({ user_id: u.id, event: "reactivation_emailed", props: {} });
      sent++;
      await sleep(120); // ~8/sec — stay under Resend rate limits
    } catch (e) {
      errors.push(`${u.id}: ${String(e)}`);
    }
  }

  return new Response(JSON.stringify({
    page, fetched: users.length, sent, skipped: users.length - sent - errors.length,
    has_more: (list?.users?.length ?? 0) === perPage, errors,
  }), { headers: { "Content-Type": "application/json" } });
});
