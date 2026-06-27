import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public one-click unsubscribe endpoint for marketing/reactivation email (CAN-SPAM).
// Link format: /functions/v1/email-unsubscribe?u=<user_id>&t=<hmac>
// The HMAC (signed with the 'unsub_secret' kept in Vault) proves the link was issued by us.
// verify_jwt is off (recipients aren't logged in when they click). The secret is fetched
// from Vault at runtime via internal_secret() — never hardcoded.

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const page = (msg: string) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Juice</title></head>
<body style="font-family:-apple-system,Helvetica,Arial,sans-serif;background:#fafafa;color:#111;display:flex;min-height:90vh;align-items:center;justify-content:center">
<div style="max-width:420px;text-align:center;padding:32px">
<h2 style="font-weight:700;margin:0 0 8px">${msg}</h2>
<p style="color:#666;font-size:15px;margin:0">You can close this tab.</p>
</div></body></html>`;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const uid = url.searchParams.get("u") ?? "";
  const token = url.searchParams.get("t") ?? "";

  const html = (body: string, status = 200) =>
    new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

  if (!uid || !token) return html(page("Invalid unsubscribe link."), 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: secret } = await supabase.rpc("internal_secret", { p_name: "unsub_secret" });
  if (!secret) return html(page("Service unavailable."), 503);

  const expected = await sign(uid, secret as string);
  if (token !== expected) return html(page("Invalid or expired unsubscribe link."), 400);

  let email: string | null = null;
  try {
    const { data } = await supabase.auth.admin.getUserById(uid);
    email = data?.user?.email ?? null;
  } catch (_) { /* best-effort email capture */ }

  await supabase.from("email_optouts").upsert({ user_id: uid, email }, { onConflict: "user_id" });

  return html(page("You're unsubscribed."));
});
