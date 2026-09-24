import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { BRAND, esc, emailShell, button, signoff, unsubFooter } from "../_shared/email.ts";

// "Someone just passed on the Juice about {name}" — the payoff for a search alert.
// A member searched a name, found nothing, and asked to be told when that changed. This
// is the highest-intent email the app can send: they asked for exactly this. Runs hourly
// via pg_cron (see migration 20260924120000). Same secret gate + CAN-SPAM footer as the
// search-miss nudge; opt-outs are excluded inside get_search_alert_matches().
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

const alertHtml = (name: string, unsubUrl: string) => {
  const safe = esc(name);
  const link = `${BRAND.appUrl}/app?q=${encodeURIComponent(name)}&src=alert`;
  return emailShell({
    preheader: `You asked to know when someone posted about ${safe}. They just did.`,
    body: `
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      You looked up <strong>${safe}</strong> and asked us to tell you when a verified member
      passed on the Juice about her.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      Someone just did. Green flag or red flag &mdash; it's live now.
    </p>
    <div style="margin:0 0 24px">${button(link, "Read it &rarr;")}</div>
    <p style="font-size:14px;line-height:1.6;color:${BRAND.muted};margin:0">
      Dated her too? Add your own flag while you're there &mdash; the second story is what makes a
      search worth trusting.
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

  const { data: rows, error } = await supabase.rpc("get_search_alert_matches", { max_rows: 200 });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }

  const matches: Array<{ alert_id: string; user_id: string; subject_name: string; story_id: string }> =
    Array.isArray(rows) ? rows : [];
  let sent = 0;
  const errors: string[] = [];

  for (const m of matches) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(m.user_id);
      const email = u?.user?.email;
      // Mark notified even without an email so a dead account doesn't re-match forever.
      if (email) {
        const token = await sign(m.user_id, unsubSecret as string);
        const unsubUrl = `${SUPA_URL}/functions/v1/email-unsubscribe?u=${encodeURIComponent(m.user_id)}&t=${token}`;
        const { error: sendErr } = await resend.emails.send({
          from: FROM,
          to: [email],
          subject: `someone just passed on the Juice about ${m.subject_name}`,
          html: alertHtml(m.subject_name, unsubUrl),
          headers: {
            "List-Unsubscribe": `<${unsubUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });
        if (sendErr) { errors.push(`${m.alert_id}: ${JSON.stringify(sendErr)}`); continue; }
        sent++;
      }

      await supabase
        .from("search_alerts")
        .update({ notified_at: new Date().toISOString(), story_id: m.story_id })
        .eq("id", m.alert_id);
      await supabase.from("analytics_events").insert({
        user_id: m.user_id,
        event: "search_alert_emailed",
        props: { name: m.subject_name, story_id: m.story_id },
      });
    } catch (e) {
      errors.push(String(e));
    }
  }

  return new Response(JSON.stringify({ matches: matches.length, sent, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});
