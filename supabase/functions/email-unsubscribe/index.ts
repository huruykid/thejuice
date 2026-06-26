import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Public one-click unsubscribe endpoint for marketing/reactivation email (CAN-SPAM).
// Link format: /functions/v1/email-unsubscribe?u=<user_id>&t=<hmac>
// The HMAC (signed with UNSUB_SECRET) proves the link was issued by us, so nobody can
// unsubscribe someone else by guessing a user id. verify_jwt is off (recipients aren't
// logged in when they click).
//
// NOTE: secret hardcoded to match the broadcast function, mirroring the other internal
// secrets in this project. Move both to a shared Supabase secret and rotate before going public.
const UNSUB_SECRET = "uns_5tH8aZ2qWp7Rx4Bz9Nv3Lc6Hd1Fg0Js";

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(UNSUB_SECRET),
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

  const expected = await sign(uid);
  if (token !== expected) return html(page("Invalid or expired unsubscribe link."), 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let email: string | null = null;
  try {
    const { data } = await supabase.auth.admin.getUserById(uid);
    email = data?.user?.email ?? null;
  } catch (_) { /* best-effort email capture */ }

  await supabase.from("email_optouts").upsert({ user_id: uid, email }, { onConflict: "user_id" });

  return html(page("You're unsubscribed."));
});
