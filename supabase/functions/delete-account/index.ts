import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Permanently deletes the calling user's account.
 *
 * Auth: caller must send their session JWT in the Authorization header.
 * We verify the token with the anon client, then use the service role
 * key to call auth.admin.deleteUser(). All user-owned rows
 * (profiles, stories, reactions, comments, user_roles, user_preferences,
 *  user_verifications, etc.) cascade-delete via FK ON DELETE CASCADE.
 *
 * The selfie in private storage is best-effort cleaned up before
 * the auth user is removed.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify the caller's identity using the anon key + their JWT.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Best-effort: clean up the verification selfie from private storage.
  try {
    const { data: ver } = await admin
      .from("user_verifications")
      .select("selfie_url")
      .eq("user_id", userId)
      .maybeSingle();
    if (ver?.selfie_url) {
      // selfie_url is stored as the object path within the bucket.
      const path = ver.selfie_url.split("/verification-selfies/").pop() ?? ver.selfie_url;
      await admin.storage.from("verification-selfies").remove([path]);
    }
  } catch (e) {
    console.warn("[delete-account] selfie cleanup failed:", e);
  }

  // Audit log before the cascade wipes everything.
  try {
    await admin.rpc("log_security_event", {
      p_user_id: userId,
      p_action: "account_deleted",
      p_resource_type: "user",
      p_resource_id: userId,
      p_details: { email: userData.user.email },
    });
  } catch (e) {
    console.warn("[delete-account] audit log failed:", e);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[delete-account] deleteUser failed:", deleteError);
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});