import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsPreFlight, createSecureResponse, createSecureErrorResponse } from '../_shared/security.ts';

interface GetUserEmailRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsPreFlight();
  }

  try {
    const { userId }: GetUserEmailRequest = await req.json();

    console.log(`Getting email for user ID: ${userId}`);

    if (!userId) {
      return createSecureErrorResponse("User ID is required", 400);
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user data using service role permissions
    const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);

    if (error) {
      console.error("Error fetching user:", error);
      return createSecureErrorResponse("Failed to fetch user data", 500);
    }

    if (!authUser.user?.email) {
      console.error("No email found for user:", userId);
      return createSecureErrorResponse("User email not found", 404);
    }

    console.log(`Successfully retrieved email for user: ${authUser.user.email}`);

    return createSecureResponse({ email: authUser.user.email });
  } catch (error: any) {
    console.error("Error in get-user-email function:", error);
    return createSecureErrorResponse(error.message, 500);
  }
};

serve(handler);