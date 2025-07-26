// Centralized security utilities for edge functions

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), location=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
};

export const getAllHeaders = () => ({
  ...corsHeaders,
  ...securityHeaders,
});

export const handleCorsPreFlight = (): Response => {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
};

export const createSecureResponse = (
  body: any,
  options: ResponseInit = {}
): Response => {
  return new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    {
      ...options,
      headers: {
        ...getAllHeaders(),
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }
  );
};

export const createSecureErrorResponse = (
  message: string,
  status: number = 400
): Response => {
  return createSecureResponse(
    { error: message },
    { status }
  );
};