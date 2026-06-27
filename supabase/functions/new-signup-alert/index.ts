import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// Founder alert: emails ADMIN_ALERT_EMAIL whenever a new user signs up.
// Triggered server-side by the on_auth_user_created_notify trigger on auth.users (via
// pg_net). Gate secret ('signup_secret') is fetched from Vault at runtime — never hardcoded.
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const FROM = "Juice <hey@sipjuice.app>";
const ADMIN_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL") ?? "huruydesigns@gmail.com";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: secret } = await supabase.rpc("internal_secret", { p_name: "signup_secret" });
  if (!secret || req.headers.get("x-signup-secret") !== secret) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" },
    });
  }

  const { email, created_at } = await req.json().catch(() => ({}));

  let total: number | null = null;
  try {
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    total = count ?? null;
  } catch (_) { /* best-effort */ }

  const who = esc(email ?? "unknown");
  const when = created_at ? new Date(created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) : "just now";

  try {
    await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      subject: `New Juice signup: ${who}`,
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:-apple-system,Helvetica,Arial,sans-serif;color:#0A0A0A;padding:24px">
          <p style="font-size:16px;margin:0 0 8px"><strong>New signup</strong> 🎉</p>
          <p style="font-size:15px;margin:0 0 4px">Email: <strong>${who}</strong></p>
          <p style="font-size:14px;color:#737373;margin:0 0 4px">When: ${when} (PT)</p>
          ${total != null ? `<p style="font-size:14px;color:#737373;margin:12px 0 0">Total members: <strong>${total}</strong></p>` : ""}
        </div>`,
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
