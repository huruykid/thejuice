import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SignJWT, importPKCS8 } from "npm:jose@5.2.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCorsPreFlight,
  createSecureResponse,
  createSecureErrorResponse,
} from "../_shared/security.ts";

interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

const getFcmAccessToken = async (): Promise<string> => {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  if (!serviceAccountJson) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");

  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const privateKey = await importPKCS8(sa.private_key, "RS256");
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Failed to get FCM access token: ${text}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight();
  }

  try {
    const { userId, title, body, data }: SendPushRequest = await req.json();

    if (!userId || !title || !body) {
      return createSecureErrorResponse("Missing required fields: userId, title, body", 400);
    }

    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    if (!projectId) {
      return createSecureErrorResponse("FIREBASE_PROJECT_ID is not set", 500);
    }

    // Create admin Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch all push tokens for this user
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("id, token")
      .eq("user_id", userId);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
      return createSecureErrorResponse("Failed to fetch push tokens", 500);
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return createSecureResponse({ sent: 0, message: "No tokens registered for this user" });
    }

    // Get FCM OAuth2 access token
    const accessToken = await getFcmAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const staleTokenIds: string[] = [];
    let sentCount = 0;

    // Send to each token
    await Promise.all(
      tokens.map(async ({ id: tokenId, token }) => {
        const message = {
          message: {
            token,
            notification: { title, body },
            ...(data ? { data } : {}),
          },
        };

        const res = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(message),
        });

        if (res.ok) {
          sentCount++;
        } else {
          const errorBody = await res.json().catch(() => ({}));
          const errorCode = errorBody?.error?.details?.[0]?.errorCode ?? "";
          const status = res.status;

          if (status === 404 || errorCode === "UNREGISTERED") {
            console.log(`Stale token detected for user ${userId}, scheduling cleanup`);
            staleTokenIds.push(tokenId);
          } else {
            console.error(`FCM send failed for token ${tokenId}:`, errorBody);
          }
        }
      })
    );

    // Clean up stale tokens
    if (staleTokenIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("push_tokens")
        .delete()
        .in("id", staleTokenIds);

      if (deleteError) {
        console.error("Failed to delete stale tokens:", deleteError);
      } else {
        console.log(`Deleted ${staleTokenIds.length} stale token(s)`);
      }
    }

    return createSecureResponse({ sent: sentCount, removed: staleTokenIds.length });
  } catch (error: any) {
    console.error("Error in send-push-notification function:", error);
    return createSecureErrorResponse("Internal server error", 500);
  }
};

serve(handler);
