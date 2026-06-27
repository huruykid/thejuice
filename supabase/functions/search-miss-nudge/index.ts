import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// "Still no tea on {name}" nudge — highest-intent posting prompt in the app.
// CAN-SPAM compliant (unsubscribe link + List-Unsubscribe header + postal address).
// Candidates already exclude opt-outs. Gate ('nudge_secret') and unsubscribe-HMAC
// ('unsub_secret') are fetched from Vault at runtime — never hardcoded.
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Juice <hey@sipjuice.app>";
const APP_URL = "https://sipjuice.app";
const SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") ?? "Juice &middot; 4460 W Shaw Ave, Fresno, CA 93722";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const FONT = `"Barlow",-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
const nudgeHtml = (name: string, unsubUrl: string) => {
  const safe = esc(name);
  const link = `${APP_URL}/app?q=${encodeURIComponent(name)}`;
  return `
  <style>@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&display=swap');</style>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">You searched ${safe} and came up empty — you could be the first.</div>
  <div style="max-width:520px;margin:0 auto;font-family:${FONT};color:#0A0A0A;padding:32px 24px">
    <div style="text-align:center;margin:0 0 28px">
      <img src="${APP_URL}/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png" alt="The Juice App" width="56" height="56" style="display:inline-block;border:0;margin:0 0 8px">
      <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#0A0A0A">The <span style="color:#F8B23A">Juice</span> App</div>
    </div>
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      You looked up <strong>${safe}</strong> a couple days ago and came up empty.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      You searched her for a reason. If you've got a story, you'd be the first to put it here —
      and the next guy who looks her up sees what you saw. A minute, fully anonymous, your name
      never attached.
    </p>
    <div style="margin:0 0 24px">
      <a href="${link}" style="background:#F8B23A;color:#0A0A0A;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;display:inline-block">Share what you know &rarr;</a>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#737373;margin:0">
      Only if it's real and it's yours. That's the whole deal here.
    </p>
    <p style="font-size:13px;color:#9A9A9A;margin:28px 0 0">&mdash; Juice</p>
    <hr style="border:none;border-top:1px solid #DBDBDB;margin:24px 0 12px">
    <p style="font-size:12px;line-height:1.5;color:#9A9A9A;margin:0">
      You're receiving this because you created a Juice account.
      <a href="${unsubUrl}" style="color:#737373">Unsubscribe</a>.<br>
      ${COMPANY_ADDRESS}
    </p>
  </div>`;
};

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

  const { data: rows, error } = await supabase.rpc("get_search_miss_candidates", { max_rows: 200 });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const candidates: Array<{ user_id: string; subject_name: string }> = Array.isArray(rows) ? rows : [];
  let sent = 0;
  const errors: string[] = [];

  for (const c of candidates) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(c.user_id);
      const email = u?.user?.email;
      if (!email) continue;

      const token = await sign(c.user_id, unsubSecret as string);
      const unsubUrl = `${SUPA_URL}/functions/v1/email-unsubscribe?u=${encodeURIComponent(c.user_id)}&t=${token}`;

      const { error: sendErr } = await resend.emails.send({
        from: FROM,
        to: [email],
        subject: `still no tea on ${c.subject_name}`,
        html: nudgeHtml(c.subject_name, unsubUrl),
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      if (sendErr) { errors.push(`${c.user_id}: ${JSON.stringify(sendErr)}`); continue; }

      await supabase.from("analytics_events").insert({
        user_id: c.user_id,
        event: "search_miss_emailed",
        props: { name: c.subject_name },
      });
      sent++;
    } catch (e) {
      errors.push(String(e));
    }
  }

  return new Response(JSON.stringify({ candidates: candidates.length, sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
