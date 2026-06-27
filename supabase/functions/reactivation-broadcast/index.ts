import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { BRAND, emailShell, button, signoff, unsubFooter } from "../_shared/email.ts";

// One-time reactivation broadcast: "come look someone up." CAN-SPAM compliant
// (unsubscribe link + List-Unsubscribe header + postal address). Excludes opt-outs and
// already-emailed users (analytics_events 'reactivation_emailed'); batches are idempotent.
// Gate ('broadcast_secret') + unsubscribe-HMAC ('unsub_secret') fetched from Vault at
// runtime — never hardcoded. A send is only counted/recorded when Resend confirms success.
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

const emailHtml = (unsubUrl: string) => emailShell({
  preheader: "You signed up but haven't looked anyone up yet. Two seconds, fully anonymous.",
  body: `
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      You signed up for Juice &mdash; but you haven't looked anyone up yet.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      That's the whole point. Search a name: someone you matched with, someone a friend warned
      you about, someone you're just curious about. Two seconds, and no one ever knows you looked.
    </p>
    <div style="margin:0 0 24px">${button(`${BRAND.appUrl}/app`, "Look someone up &rarr;")}</div>
    <p style="font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0">
      If she's already in here, you'll see it. If she's not&hellip; you might be the one who knows something.
    </p>
    ${signoff()}
    ${unsubFooter(unsubUrl, COMPANY_ADDRESS)}`,
});

async function sendTo(email: string, uid: string, unsubSecret: string): Promise<unknown | null> {
  const token = await sign(uid, unsubSecret);
  const unsubUrl = `${SUPA_URL}/functions/v1/email-unsubscribe?u=${encodeURIComponent(uid)}&t=${token}`;
  const { error } = await resend.emails.send({
    from: FROM,
    to: [email],
    subject: "who are you curious about?",
    html: emailHtml(unsubUrl),
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  return error ?? null;
}

Deno.serve(async (req) => {
  const supabase = createClient(SUPA_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

  const { data: bSecret } = await supabase.rpc("internal_secret", { p_name: "broadcast_secret" });
  if (!bSecret || req.headers.get("x-broadcast-secret") !== bSecret) {
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

  const body = await req.json().catch(() => ({}));

  if (body.test_email) {
    const err = await sendTo(body.test_email, "test-preview-user", unsubSecret as string);
    return new Response(JSON.stringify({ test: true, sent_to: body.test_email, error: err }), {
      status: err ? 500 : 200, headers: { "Content-Type": "application/json" },
    });
  }

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
      const err = await sendTo(u.email!, u.id, unsubSecret as string);
      if (err) { errors.push(`${u.id}: ${JSON.stringify(err)}`); continue; }
      await supabase.from("analytics_events").insert({ user_id: u.id, event: "reactivation_emailed", props: {} });
      sent++;
      await sleep(120);
    } catch (e) {
      errors.push(`${u.id}: ${String(e)}`);
    }
  }

  return new Response(JSON.stringify({
    page, fetched: users.length, sent, skipped: users.length - sent - errors.length,
    has_more: (list?.users?.length ?? 0) === perPage, errors,
  }), { headers: { "Content-Type": "application/json" } });
});
