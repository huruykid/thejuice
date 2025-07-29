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

    // Verify the requester is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createSecureErrorResponse("Authorization required", 401);
    }

    // Get the calling user's ID from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !callingUser) {
      return createSecureErrorResponse("Invalid authentication", 401);
    }

    // Check if calling user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id)
      .eq('role', 'admin');

    if (roleError || !roles || roles.length === 0) {
      console.error(`Unauthorized access attempt by user: ${callingUser.id}`);
      return createSecureErrorResponse("Admin access required", 403);
    }

    // Log the admin access for security audit
    await supabase.rpc('log_security_event', {
      p_user_id: callingUser.id,
      p_action: 'admin_email_lookup',
      p_resource_type: 'user_email',
      p_resource_id: userId,
      p_details: { timestamp: new Date().toISOString() }
    });

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