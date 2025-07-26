// Security utilities for input validation and sanitization

/**
 * Sanitizes text content to prevent XSS attacks
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    // Remove script tags and javascript protocols
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .replace(/onmouseover\s*=/gi, '')
    // Limit length
    .substring(0, 5000);
};

/**
 * Validates username according to security rules
 */
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username) {
    return { isValid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 20) {
    return { isValid: false, error: 'Username must be 20 characters or less' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and dashes' };
  }
  
  const reservedNames = [
    'admin', 'administrator', 'root', 'system', 'support', 'help',
    'api', 'www', 'mail', 'ftp', 'blog', 'shop', 'store', 'news',
    'about', 'contact', 'terms', 'privacy', 'security', 'login',
    'signup', 'register', 'auth', 'oauth', 'settings', 'profile',
    'dashboard', 'account', 'user', 'users', 'null', 'undefined',
    'anonymous', 'guest', 'test', 'demo', 'sample', 'example'
  ];
  
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: 'This username is reserved and cannot be used' };
  }
  
  if (/admin|root|system|support|help|api|www|mail|ftp/i.test(trimmed)) {
    return { isValid: false, error: 'Username contains reserved words' };
  }
  
  return { isValid: true };
};

/**
 * Validates story content
 */
export const validateStoryContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content) {
    return { isValid: false, error: 'Story content is required' };
  }
  
  const trimmed = content.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Story content cannot be empty' };
  }
  
  if (trimmed.length > 5000) {
    return { isValid: false, error: 'Story content must be 5000 characters or less' };
  }
  
  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: 'Story content contains prohibited elements' };
    }
  }
  
  return { isValid: true };
};

/**
 * Validates rating values
 */
export const validateRating = (rating: number, name: string): { isValid: boolean; error?: string } => {
  if (typeof rating !== 'number' || isNaN(rating)) {
    return { isValid: false, error: `${name} rating must be a number` };
  }
  
  if (rating < 1 || rating > 5) {
    return { isValid: false, error: `${name} rating must be between 1 and 5` };
  }
  
  return { isValid: true };
};

/**
 * Validates tag input
 */
export const validateTag = (tag: string): { isValid: boolean; error?: string } => {
  if (!tag) {
    return { isValid: false, error: 'Tag cannot be empty' };
  }
  
  const trimmed = tag.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Tag cannot be empty' };
  }
  
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Tag must be 50 characters or less' };
  }
  
  // Allow emojis, unicode characters, and common punctuation for tags
  if (!/^[\p{L}\p{N}\p{P}\p{S}\p{Z}_-]+$/u.test(trimmed)) {
    return { isValid: false, error: 'Tag contains invalid characters' };
  }
  
  return { isValid: true };
};

/**
 * Validates phone number format
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Phone is optional
  }
  
  const trimmed = phone.trim();
  
  // Basic phone number validation (US format)
  // Allows: +1234567890, (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  const phoneRegex = /^\+?1?[-.\s()]?(\d{3})[-.\s()]?(\d{3})[-.\s()]?(\d{4})$/;
  
  if (!phoneRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid phone number format. Use formats like: (123) 456-7890, 123-456-7890, or 1234567890' };
  }
  
  return { isValid: true };
};

/**
 * Enhanced XSS prevention with more comprehensive sanitization
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  return html
    .trim()
    // Remove all script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove potentially dangerous protocols
    .replace(/(javascript|data|vbscript|file|about):/gi, 'unsafe:')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, 'data-removed=')
    // Remove style attributes that could contain expressions
    .replace(/style\s*=\s*['"'][^'"]*expression[^'"]*['"]/gi, '')
    // Remove iframe, embed, object tags
    .replace(/<(iframe|embed|object|applet|meta|link|base)[^>]*>/gi, '')
    // Limit length
    .substring(0, 10000);
};

/**
 * Rate limiting helper - tracks actions per user
 */
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
  
  getRemainingAttempts(key: string, maxAttempts: number, windowMs: number): number {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    return Math.max(0, maxAttempts - recentAttempts.length);
  }
  
  getTimeUntilReset(key: string, windowMs: number): number {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    const resetTime = oldestAttempt + windowMs;
    return Math.max(0, resetTime - now);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Security headers for API responses
 */
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), location=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;",
});

/**
 * Comprehensive input sanitization for all user inputs
 */
export const sanitizeUserInput = (input: string, maxLength: number = 5000): string => {
  if (!input) return '';
  
  return sanitizeText(input.substring(0, maxLength));
};

/**
 * Validates and sanitizes profile data
 */
export const validateProfileData = (data: {
  anonymous_username?: string;
  phone_number?: string;
  city?: string;
  relationship_status?: string;
}): { isValid: boolean; errors: string[]; sanitizedData: any } => {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  if (data.anonymous_username) {
    const usernameValidation = validateUsername(data.anonymous_username);
    if (!usernameValidation.isValid) {
      errors.push(usernameValidation.error!);
    } else {
      sanitizedData.anonymous_username = sanitizeText(data.anonymous_username);
    }
  }
  
  if (data.phone_number) {
    const phoneValidation = validatePhoneNumber(data.phone_number);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error!);
    } else {
      sanitizedData.phone_number = sanitizeText(data.phone_number);
    }
  }
  
  if (data.city) {
    sanitizedData.city = sanitizeText(data.city.substring(0, 100));
  }
  
  if (data.relationship_status) {
    sanitizedData.relationship_status = sanitizeText(data.relationship_status.substring(0, 50));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
};