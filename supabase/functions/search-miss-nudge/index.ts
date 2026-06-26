import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// "Still no tea on {name}" nudge — the highest-intent posting prompt in the app.
// Finds users who searched a name, came up empty, never posted, and haven't been
// nudged about that name, then emails them once. Triggered daily by the
// `daily-search-miss-nudge` pg_cron job (verify_jwt off; gated by a shared secret).
//
// NOTE: secret is hardcoded to match the cron header, mirroring selfie-sweep. Move to a
// Supabase secret (Deno.env.get('NUDGE_SECRET')) and rotate if this repo goes public.
const NUDGE_SECRET = "ndg_8kQ2mWp5Rt7Yx3Bz9Nv4Lc6Hd1Fg0Js";
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Juice <hey@sipjuice.app>";
const APP_URL = "https://sipjuice.app";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const nudgeHtml = (name: string) => {
  const safe = esc(name);
  const link = `${APP_URL}/app?q=${encodeURIComponent(name)}`;
  return `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">You searched ${safe} and came up empty — you could be the first.</div>
  <div style="max-width:520px;margin:0 auto;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#111;padding:32px 24px">
    <p style="font-size:16px;line-height:1.6;margin:0 0 18px">
      You looked up <strong>${safe}</strong> a couple days ago and came up empty.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px">
      You searched her for a reason. If you've got a story, you'd be the first to put it here —
      and the next guy who looks her up sees what you saw. A minute, fully anonymous, your name
      never attached.
    </p>
    <div style="margin:0 0 24px">
      <a href="${link}" style="background:#111;color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:600;display:inline-block">Share what you know &rarr;</a>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#666;margin:0">
      Only if it's real and it's yours. That's the whole deal here.
    </p>
    <p style="font-size:13px;color:#999;margin:28px 0 0">&mdash; Juice</p>
  </div>`;
};

Deno.serve(async (req) => {
  if (req.headers.get("x-nudge-secret") !== NUDGE_SECRET) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

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

      await resend.emails.send({
        from: FROM,
        to: [email],
        subject: `still no tea on ${c.subject_name}`,
        html: nudgeHtml(c.subject_name),
      });

      // Record the send so we never nudge this user about this name again.
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
