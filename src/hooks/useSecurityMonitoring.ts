import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSecurityEventLogger } from './useSecurityAudit';
import { useToast } from '@/hooks/use-toast';

interface SecurityPattern {
  userId: string;
  action: string;
  count: number;
  timeWindow: number; // in minutes
}

export const useSecurityMonitoring = (userId?: string) => {
  const [suspiciousActivity, setSuspiciousActivity] = useState<SecurityPattern[]>([]);
  const { logSuspiciousActivity } = useSecurityEventLogger();
  const { toast } = useToast();

  // Track failed login attempts
  const trackFailedLogin = (email: string, ipAddress?: string) => {
    logSuspiciousActivity('failed_login_attempt', {
      email,
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });
  };

  // Track rapid profile changes
  const trackProfileChange = (changedFields: string[]) => {
    if (!userId) return;
    
    const now = Date.now();
    const key = `profile_change_${userId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const data = JSON.parse(stored);
      const timeDiff = now - data.lastChange;
      
      // If multiple changes within 5 minutes, flag as suspicious
      if (timeDiff < 5 * 60 * 1000) {
        data.count += 1;
        if (data.count >= 3) {
          logSuspiciousActivity('rapid_profile_changes', {
            changed_fields: changedFields,
            change_count: data.count,
            time_window_minutes: 5
          });
          
          toast({
            title: "Security Alert",
            description: "Multiple rapid profile changes detected. Account may be compromised.",
            variant: "destructive"
          });
        }
      } else {
        // Reset counter if more than 5 minutes passed
        data.count = 1;
      }
      
      data.lastChange = now;
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, JSON.stringify({ count: 1, lastChange: now }));
    }
  };

  // Track unusual login patterns
  const trackLoginPattern = (email: string) => {
    const now = Date.now();
    const key = `login_pattern_${email}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const data = JSON.parse(stored);
      const timeDiff = now - data.lastLogin;
      
      // Check for rapid login attempts
      if (timeDiff < 2 * 60 * 1000) { // 2 minutes
        data.attempts += 1;
        if (data.attempts >= 5) {
          logSuspiciousActivity('rapid_login_attempts', {
            email,
            attempt_count: data.attempts,
            time_window_minutes: 2
          });
        }
      } else {
        data.attempts = 1;
      }
      
      data.lastLogin = now;
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, JSON.stringify({ attempts: 1, lastLogin: now }));
    }
  };

  // Monitor for session hijacking attempts
  useEffect(() => {
    if (!userId) return;
    
    const checkSessionSecurity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const tokenExp = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          
          // Check if token is about to expire (within 5 minutes)
          if (tokenExp && (tokenExp - now) < 300) {
            // Attempt to refresh token
            const { error } = await supabase.auth.refreshSession();
            if (error) {
              logSuspiciousActivity('token_refresh_failed', {
                error: error.message,
                expires_at: tokenExp
              });
            }
          }
        }
      } catch (error) {
        console.error('Session security check failed:', error);
      }
    };

    // Check session security every 5 minutes
    const interval = setInterval(checkSessionSecurity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId, logSuspiciousActivity]);

  // Enhanced content moderation for stories
  const moderateContent = (content: string): { isViolation: boolean; reasons: string[] } => {
    const violations: string[] = [];
    
    // Check for potentially harmful content
    const harmfulPatterns = [
      /\b(kill|murder|suicide|harm|death|die)\b/gi,
      /\b(hate|racist|nazi|white power|supremacy)\b/gi,
      /\b(drug|cocaine|heroin|meth|fentanyl|crack)\b/gi,
      /\b(revenge|blackmail|extort|threaten|bomb)\b/gi,
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script injection
      /javascript:/gi, // JavaScript URLs
      /data:text\/html/gi, // Data URLs
      /on\w+\s*=/gi, // Event handlers
    ];
    
    harmfulPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        violations.push(`Harmful content detected (pattern ${index + 1})`);
      }
    });
    
    // Check for spam indicators
    const spamPatterns = [
      /(.)\1{10,}/g, // Repeated characters
      /\b(buy now|click here|free money|limited time|act now|urgent)\b/gi,
      /(http|www)\./gi, // URLs
      /\b(viagra|cialis|pharmacy|casino|poker|lottery)\b/gi,
      /(.{10,})\1{3,}/g, // Repeated phrases
      /[\W_]{10,}/g, // Excessive special characters
    ];
    
    spamPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        violations.push(`Spam indicator detected (pattern ${index + 1})`);
      }
    });

    // Check for social engineering
    const socialEngineeringPatterns = [
      /\b(verify account|urgent|immediate|expire|suspend)\b/gi,
      /\b(password|credit card|social security|ssn|bank account)\b/gi,
      /\b(click here|download now|install|update required)\b/gi,
    ];

    socialEngineeringPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        violations.push(`Social engineering detected (pattern ${index + 1})`);
      }
    });

    // Check content length for potential DoS
    if (content.length > 10000) {
      violations.push('Content exceeds maximum allowed length');
    }
    
    if (violations.length > 0) {
      logSuspiciousActivity('content_moderation_violation', {
        content_preview: content.substring(0, 100),
        violations,
        content_length: content.length
      });
    }
    
    return {
      isViolation: violations.length > 0,
      reasons: violations
    };
  };

  return {
    trackFailedLogin,
    trackProfileChange,
    trackLoginPattern,
    moderateContent,
    suspiciousActivity
  };
};