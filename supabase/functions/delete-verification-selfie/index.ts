import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteSelfieRequest {
  verificationId: string;
  selfieUrl: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.log('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.log('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    if (roleError || !userRoles?.some(r => r.role === 'admin')) {
      console.log('User is not admin:', user.id)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { verificationId, selfieUrl }: DeleteSelfieRequest = await req.json()

    if (!verificationId || !selfieUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing verificationId or selfieUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting selfie deletion for verification ${verificationId}`)

    // Extract file path. `selfieUrl` may be a full URL (public/signed) or
    // already a storage path like `{subjectUserId}/{fileName}`.
    let filePath: string
    try {
      const url = new URL(selfieUrl)
      const pathParts = url.pathname.split('/').filter(Boolean)
      const bucketIdx = pathParts.indexOf('verification-selfies')
      if (bucketIdx === -1 || bucketIdx >= pathParts.length - 1) {
        return new Response(
          JSON.stringify({ error: 'Invalid selfie URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      filePath = pathParts.slice(bucketIdx + 1).join('/')
    } catch {
      // Not a URL — treat as raw storage path, optionally strip bucket prefix
      filePath = selfieUrl.replace(/^\/+/, '').replace(/^verification-selfies\//, '')
    }

    if (!filePath || !filePath.includes('/')) {
      return new Response(
        JSON.stringify({ error: 'Invalid selfie path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Deleting file: ${filePath}`)

    // Delete the file from storage and verify it was actually removed
    const { data: removedFiles, error: deleteError } = await supabase.storage
      .from('verification-selfies')
      .remove([filePath])

    const storageDeleted = !deleteError && Array.isArray(removedFiles) && removedFiles.length > 0

    if (deleteError) {
      console.error('Failed to delete file from storage:', deleteError)
    }
    if (!storageDeleted) {
      console.error('Storage deletion did not remove any files for path:', filePath)
      return new Response(
        JSON.stringify({ error: 'Failed to delete selfie file from storage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the verification record to clear selfie_url and add audit info
    const { error: updateError } = await supabase
      .from('user_verifications')
      .update({
        selfie_url: null,
        selfie_deleted_at: new Date().toISOString(),
        deleted_by: user.id
      })
      .eq('id', verificationId)

    if (updateError) {
      console.error('Failed to update verification record:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update verification record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log security event for audit trail
    const { error: auditError } = await supabase.rpc('log_security_event', {
      p_user_id: user.id,
      p_action: 'verification_selfie_deleted',
      p_resource_type: 'verification',
      p_resource_id: verificationId,
      p_details: {
        file_path: filePath,
        original_url: selfieUrl,
        deleted_at: new Date().toISOString(),
        storage_deletion_success: storageDeleted
      }
    })

    if (auditError) {
      console.error('Failed to log security event:', auditError)
    }

    console.log(`Successfully deleted selfie for verification ${verificationId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Selfie deleted successfully',
        storage_deleted: storageDeleted
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})