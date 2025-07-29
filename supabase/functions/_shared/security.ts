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
  'Permissions-Policy': 'camera=(), microphone=(), location=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
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

// Rate limiting store (in-memory for edge functions)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean => {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
};

export const createRateLimitErrorResponse = (): Response => {
  return createSecureErrorResponse(
    'Rate limit exceeded. Please try again later.',
    429
  );
};