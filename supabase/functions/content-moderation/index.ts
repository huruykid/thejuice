import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createSecureResponse, createSecureErrorResponse, checkRateLimit, createRateLimitErrorResponse } from '../_shared/security.ts';

interface ModerationRequest {
  content: string;
  userId: string;
  contentType: 'story' | 'comment' | 'profile';
}

interface ModerationResult {
  isAllowed: boolean;
  confidence: number;
  reasons: string[];
  flaggedWords: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user IP for rate limiting
    const userIP = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Apply rate limiting (10 requests per minute per IP)
    if (!checkRateLimit(`moderation_${userIP}`, 10, 60000)) {
      return createRateLimitErrorResponse();
    }

    const { content, userId, contentType }: ModerationRequest = await req.json();

    if (!content || !userId || !contentType) {
      return createSecureErrorResponse('Missing required fields: content, userId, contentType');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Perform content moderation
    const moderationResult = await moderateContent(content, contentType);

    // Log moderation event
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_action: 'content_moderation_check',
      p_resource_type: contentType,
      p_details: {
        is_allowed: moderationResult.isAllowed,
        confidence: moderationResult.confidence,
        reasons: moderationResult.reasons,
        content_length: content.length
      }
    });

    // If content is flagged, log as suspicious activity
    if (!moderationResult.isAllowed) {
      await supabase.rpc('log_security_event', {
        p_user_id: userId,
        p_action: 'suspicious_activity',
        p_resource_type: 'content_moderation',
        p_details: {
          activity_type: 'content_violation',
          content_type: contentType,
          violations: moderationResult.reasons,
          flagged_words: moderationResult.flaggedWords
        }
      });
    }

    return createSecureResponse(moderationResult);

  } catch (error) {
    console.error('Content moderation error:', error);
    return createSecureErrorResponse('Internal server error', 500);
  }
};

async function moderateContent(content: string, contentType: string): Promise<ModerationResult> {
  const result: ModerationResult = {
    isAllowed: true,
    confidence: 1.0,
    reasons: [],
    flaggedWords: []
  };

  // Harmful content patterns
  const harmfulPatterns = [
    { pattern: /\b(kill|murder|suicide|self-harm|hurt yourself)\b/gi, reason: 'Violence/Self-harm content' },
    { pattern: /\b(nazi|hitler|genocide|terrorist)\b/gi, reason: 'Hate speech' },
    { pattern: /\b(cocaine|heroin|meth|fentanyl|drug dealer)\b/gi, reason: 'Illegal drug content' },
    { pattern: /\b(revenge porn|blackmail|extortion)\b/gi, reason: 'Harmful/illegal activities' },
    { pattern: /\b(doxx|dox|home address|phone number leak)\b/gi, reason: 'Privacy violation' }
  ];

  // Spam patterns
  const spamPatterns = [
    { pattern: /(.)\1{15,}/g, reason: 'Repeated character spam' },
    { pattern: /\b(buy now|click here|free money|limited time offer|make money fast)\b/gi, reason: 'Commercial spam' },
    { pattern: /(https?:\/\/|www\.)[^\s]+/gi, reason: 'Suspicious links' },
    { pattern: /\b(crypto|bitcoin|investment opportunity|get rich quick)\b/gi, reason: 'Financial spam' }
  ];

  // Dating app specific violations
  const datingViolations = [
    { pattern: /\b(send nudes|sexy pics|hookup tonight|sugar daddy|escort)\b/gi, reason: 'Inappropriate sexual content' },
    { pattern: /\b(venmo|cashapp|paypal|send money)\b/gi, reason: 'Financial solicitation' },
    { pattern: /\b(snapchat|instagram|telegram|whatsapp|kik)\b/gi, reason: 'External platform solicitation' }
  ];

  const allPatterns = [...harmfulPatterns, ...spamPatterns, ...datingViolations];

  // Check content against patterns
  for (const { pattern, reason } of allPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      result.isAllowed = false;
      result.reasons.push(reason);
      result.flaggedWords.push(...matches);
      result.confidence = Math.max(0.1, result.confidence - 0.3);
    }
  }

  // Check content length for spam
  if (content.length > 5000) {
    result.reasons.push('Content too long');
    result.confidence -= 0.2;
  }

  // Check for excessive capitalization
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 50) {
    result.reasons.push('Excessive capitalization');
    result.confidence -= 0.1;
  }

  // Dating-specific checks
  if (contentType === 'story') {
    // Check for fake/promotional content
    const promotionalPatterns = [
      /\b(professional|model|influencer|follow me|check out my)\b/gi,
      /\b(rates|prices|services|available now)\b/gi
    ];

    for (const pattern of promotionalPatterns) {
      if (pattern.test(content)) {
        result.reasons.push('Promotional/commercial content');
        result.confidence -= 0.3;
        result.isAllowed = false;
        break;
      }
    }
  }

  // Final confidence adjustment
  if (result.reasons.length === 0) {
    result.confidence = 1.0;
  } else {
    result.confidence = Math.max(0.0, result.confidence);
    if (result.confidence < 0.5) {
      result.isAllowed = false;
    }
  }

  return result;
}

serve(handler);