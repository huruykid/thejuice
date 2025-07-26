import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SecurityAuditEvent {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
}

export const useSecurityAudit = () => {
  const logSecurityEvent = useMutation({
    mutationFn: async (event: SecurityAuditEvent) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Cannot log security event: user not authenticated');
        return;
      }

      // Call the database function to log the security event
      const { error } = await supabase.rpc('log_security_event', {
        p_user_id: user.id,
        p_action: event.action,
        p_resource_type: event.resourceType,
        p_resource_id: event.resourceId || null,
        p_details: event.details || null
      });

      if (error) {
        console.error('Failed to log security event:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Security audit logging failed:', error);
    }
  });

  return {
    logSecurityEvent: logSecurityEvent.mutate,
    isLogging: logSecurityEvent.isPending
  };
};

// Helper functions for common security events
export const useSecurityEventLogger = () => {
  const { logSecurityEvent } = useSecurityAudit();

  const logLoginAttempt = (success: boolean, method: string = 'email') => {
    logSecurityEvent({
      action: success ? 'login_success' : 'login_failed',
      resourceType: 'auth',
      details: { method }
    });
  };

  const logPasswordChange = () => {
    logSecurityEvent({
      action: 'password_changed',
      resourceType: 'auth'
    });
  };

  const logProfileUpdate = (changes: string[]) => {
    logSecurityEvent({
      action: 'profile_updated',
      resourceType: 'profile',
      details: { changed_fields: changes }
    });
  };

  const logVerificationSubmission = (verificationId: string) => {
    logSecurityEvent({
      action: 'verification_submitted',
      resourceType: 'verification',
      resourceId: verificationId
    });
  };

  const logSuspiciousActivity = (activityType: string, details: Record<string, any>) => {
    logSecurityEvent({
      action: 'suspicious_activity',
      resourceType: 'security',
      details: { activity_type: activityType, ...details }
    });
  };

  return {
    logLoginAttempt,
    logPasswordChange,
    logProfileUpdate,
    logVerificationSubmission,
    logSuspiciousActivity
  };
};