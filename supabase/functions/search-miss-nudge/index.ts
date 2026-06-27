import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { BRAND, esc, emailShell, button, signoff, unsubFooter } from "../_shared/email.ts";

// "Still no tea on {name}" nudge — highest-intent posting prompt in the app.
// CAN-SPAM compliant (unsubscribe link + List-Unsubscribe header + postal address).
// Candidates already exclude opt-outs. Gate ('nudge_secret') + unsubscribe-HMAC
// ('unsub_secret') are fetched from Vault at runtime — never hardcoded.
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Juice <hey@sipjuice.app>";
const SUPA_URL = Deno.env.get("SUPABASE_URL") ?? "";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") ?? "Juice &middot; 4460 W Shaw Ave, Fresno, CA 93722";

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const nudgeHtml = (name: string, unsubUrl: string) => {
  const safe = esc(name);
  const link = `${BRAND.appUrl}/app?q=${encodeURIComponent(name)}`;
  return emailShell({
    preheader: `You searched ${safe} and came up empty — you could be the first.`,
    body: `
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      You looked up <strong>${safe}</strong> a couple days ago and came up empty.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      You searched her for a reason. If you've got a story, you'd be the first to put it here —
      and the next guy who looks her up sees what you saw. A minute, fully anonymous, your name
      never attached.
    </p>
    <div style="margin:0 0 24px">${button(link, "Share what you know &rarr;")}</div>
    <p style="font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0">
      Only if it's real and it's yours. That's the whole deal here.
    </p>
    ${signoff()}
    ${unsubFooter(unsubUrl, COMPANY_ADDRESS)}`,
  });
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
