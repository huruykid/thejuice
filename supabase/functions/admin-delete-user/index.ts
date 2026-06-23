import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/security.ts";

/**
 * Admin-invoked permanent deletion of a user account.
 * Caller must be authenticated AND have role 'admin'.
 * All user-owned rows cascade via FK ON DELETE CASCADE.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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

  const callerId = userData.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller is an admin
  const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
    _user_id: callerId,
    _role: "admin",
  });
  if (roleErr || !isAdminData) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: { userId?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const targetId = body.userId;
  if (!targetId || typeof targetId !== "string") {
    return new Response(JSON.stringify({ error: "userId required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (targetId === callerId) {
    return new Response(JSON.stringify({ error: "Use delete-account to remove your own account" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Best-effort: clean up the verification selfie from private storage.
  try {
    const { data: ver } = await admin
      .from("user_verifications")
      .select("selfie_url")
      .eq("user_id", targetId)
      .maybeSingle();
    if (ver?.selfie_url) {
      const path = ver.selfie_url.split("/verification-selfies/").pop() ?? ver.selfie_url;
      await admin.storage.from("verification-selfies").remove([path]);
    }
  } catch (e) {
    console.warn("[admin-delete-user] selfie cleanup failed:", e);
  }

  try {
    await admin.rpc("log_security_event", {
      p_user_id: callerId,
      p_action: "admin_user_deleted",
      p_resource_type: "user",
      p_resource_id: targetId,
      p_details: { reason: body.reason ?? null },
    });
  } catch (e) {
    console.warn("[admin-delete-user] audit log failed:", e);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(targetId);
  if (deleteError) {
    console.error("[admin-delete-user] deleteUser failed:", deleteError);
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