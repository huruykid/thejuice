import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SignJWT, importPKCS8 } from "npm:jose@5.2.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  handleCorsPreFlight,
  createSecureResponse,
  createSecureErrorResponse,
  authenticateRequest,
} from "../_shared/security.ts";

// The client may ONLY ask us to send a templated notification tied to a
// specific event on a specific story. It cannot choose the recipient, the
// title/body, or the deep-link route — those are all derived server-side from
// the verified event. This closes the IDOR where any authenticated caller
// could push arbitrary content to any user.
type PushEventType = "reaction" | "comment";

interface SendPushRequest {
  type: PushEventType;
  storyId: string;
}

const NOTIFICATION_TEMPLATES: Record<
  PushEventType,
  { title: string; body: string }
> = {
  reaction: { title: "New reaction 🚩", body: "Someone reacted to your story" },
  comment: { title: "New comment 💬", body: "Someone commented on your story" },
};

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
    // Require an authenticated caller. Prevents unauthenticated abuse
    // (spam/phishing notifications, user-existence probing).
    const auth = await authenticateRequest(req);
    if (auth instanceof Response) return auth;

    const { type, storyId }: SendPushRequest = await req.json();

    if (!type || !storyId || !(type in NOTIFICATION_TEMPLATES)) {
      return createSecureErrorResponse("Missing or invalid fields: type, storyId", 400);
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

    // Derive the recipient server-side: notifications go to the STORY OWNER,
    // never to a caller-supplied user id.
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("user_id")
      .eq("id", storyId)
      .maybeSingle();

    if (storyError) {
      console.error("Error fetching story:", storyError);
      return createSecureErrorResponse("Failed to resolve story", 500);
    }

    const recipientId: string | null = story?.user_id ?? null;
    if (!recipientId) {
      return createSecureResponse({ sent: 0, message: "Story has no owner to notify" });
    }

    // Never notify yourself about your own action.
    if (recipientId === auth.userId) {
      return createSecureResponse({ sent: 0, message: "No self-notification" });
    }

    // Defense in depth: confirm the caller actually performed the action they
    // claim, so this endpoint can't be used to spam a story owner.
    const actionTable = type === "reaction" ? "reactions" : "comments";
    const { data: actionRow, error: actionError } = await supabase
      .from(actionTable)
      .select("id")
      .eq("story_id", storyId)
      .eq("user_id", auth.userId)
      .limit(1)
      .maybeSingle();

    if (actionError) {
      console.error("Error verifying caller action:", actionError);
      return createSecureErrorResponse("Failed to verify action", 500);
    }
    if (!actionRow) {
      return createSecureErrorResponse("Forbidden", 403);
    }

    // Server-templated content + route. Caller cannot inject any of this.
    const { title, body } = NOTIFICATION_TEMPLATES[type];
    const data: Record<string, string> = { route: `/story/${storyId}` };
    const userId = recipientId;

    // Fetch all push tokens for the recipient
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
