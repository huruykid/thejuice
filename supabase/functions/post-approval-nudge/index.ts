import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { BRAND, esc, emailShell, button, signoff, unsubFooter } from "../_shared/email.ts";

// 24h post-approval nudge — sent to members whose verification was approved between
// 24 and 72 hours ago who still haven't posted a single story. One email per member,
// ever: a 'post_approval_nudge_emailed' analytics_events row makes re-runs idempotent.
// CAN-SPAM compliant (unsubscribe link + List-Unsubscribe header + postal address).
// Gate ('nudge_secret') and unsubscribe-HMAC ('unsub_secret') come from Vault at runtime.
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Juice <hey@sipjuice.app>";
const SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") ?? "Juice &middot; 4460 W Shaw Ave, Fresno, CA 93722";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const nudgeHtml = (username: string | null, unsubUrl: string) => {
  const hi = username ? `Hey ${esc(username)},` : "Hey,";
  return emailShell({
    preheader: "You're verified. One story is all it takes to pull your weight.",
    body: `
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      ${hi} you got verified yesterday &mdash; welcome in.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      Every story on Juice is here because a guy like you took a minute to write one. Right now
      you haven't posted yet, and the next man who looks up a name is counting on someone who has.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      One date, one honest read: <strong>Juice</strong> if she's a green flag,
      <strong>Milk</strong> if she's a red one. Takes about a minute, and it's posted under your
      codename &mdash; your real name is never attached to anything.
    </p>
    <div style="margin:0 0 24px">${button(`${BRAND.appUrl}/app`, "Write your first story &rarr;")}</div>
    <p style="font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0">
      Only if it's real and it's yours. That's the whole deal here.
    </p>
    ${signoff()}
    ${unsubFooter(unsubUrl, COMPANY_ADDRESS)}`,
  });
};

async function sendTo(email: string, uid: string, username: string | null, unsubSecret: string) {
  const token = await sign(uid, unsubSecret);
  const unsubUrl = `${SUPA_URL}/functions/v1/email-unsubscribe?u=${encodeURIComponent(uid)}&t=${token}`;
  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: "you're in — now put one story on the board",
    html: nudgeHtml(username, unsubUrl),
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  return error ?? null;
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPA_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  const { data: nudgeSecret } = await supabase.rpc("internal_secret", { p_name: "nudge_secret" });
  if (!nudgeSecret || req.headers.get("x-nudge-secret") !== nudgeSecret) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }
  const { data: unsubSecret } = await supabase.rpc("internal_secret", { p_name: "unsub_secret" });
  if (!unsubSecret) {
    return new Response(JSON.stringify({ error: "unsub secret unavailable" }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  // Test mode: single preview send, nothing recorded.
  if (typeof body.test_email === "string" && body.test_email) {
    const err = await sendTo(body.test_email, "test-preview-user", null, unsubSecret as string);
    return new Response(JSON.stringify({ test: true, sent_to: body.test_email, error: err }), {
      status: err ? 500 : 200, headers: { "Content-Type": "application/json" },
    });
  }

  const now = Date.now();
  const windowStart = new Date(now - 72 * 3600 * 1000).toISOString(); // not older than 72h
  const windowEnd = new Date(now - 24 * 3600 * 1000).toISOString();   // at least 24h ago

  // Approved between 24h and 72h ago. updated_at is set when the admin flips the status.
  const { data: approved, error: vErr } = await supabase
    .from("user_verifications")
    .select("user_id, updated_at")
    .eq("verification_status", "approved")
    .gte("updated_at", windowStart)
    .lte("updated_at", windowEnd)
    .limit(500);

  if (vErr) {
    return new Response(JSON.stringify({ error: vErr.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const ids = (approved ?? []).map((r: { user_id: string }) => r.user_id);
  if (ids.length === 0) {
    return new Response(JSON.stringify({ candidates: 0, sent: 0, errors: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Skip: anyone who already posted, opted out, or was already nudged.
  const [{ data: posters }, { data: outs }, { data: sentRows }, { data: profiles }] = await Promise.all([
    supabase.from("stories").select("user_id").in("user_id", ids),
    supabase.from("email_optouts").select("user_id").in("user_id", ids),
    supabase.from("analytics_events").select("user_id").eq("event", "post_approval_nudge_emailed").in("user_id", ids),
    supabase.from("profiles").select("user_id, anonymous_username").in("user_id", ids),
  ]);

  const skip = new Set<string>([
    ...(posters ?? []).map((r: { user_id: string }) => r.user_id),
    ...(outs ?? []).map((r: { user_id: string }) => r.user_id),
    ...(sentRows ?? []).map((r: { user_id: string }) => r.user_id),
  ]);
  const nameById = new Map<string, string | null>(
    (profiles ?? []).map((p: { user_id: string; anonymous_username: string | null }) => [p.user_id, p.anonymous_username]),
  );

  let sent = 0;
  const errors: string[] = [];
  for (const uid of ids) {
    if (skip.has(uid)) continue;
    try {
      const { data: u } = await supabase.auth.admin.getUserById(uid);
      const email = u?.user?.email;
      if (!email) continue;
      const err = await sendTo(email, uid, nameById.get(uid) ?? null, unsubSecret as string);
      if (err) { errors.push(`${uid}: ${JSON.stringify(err)}`); continue; }
      await supabase.from("analytics_events").insert({
        user_id: uid, event: "post_approval_nudge_emailed", props: {},
      });
      sent++;
      await sleep(120);
    } catch (e) {
      errors.push(`${uid}: ${String(e)}`);
    }
  }

  return new Response(JSON.stringify({
    candidates: ids.length, sent, skipped: ids.length - sent - errors.length, errors,
  }), { headers: { "Content-Type": "application/json" } });
});
