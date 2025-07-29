import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';

interface SecurityContextType {
  extendSession: () => Promise<void>;
  moderateContent: (content: string) => { isViolation: boolean; reasons: string[] };
  trackProfileChange: (fields: string[]) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
  sessionTimeoutMinutes?: number;
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ 
  children, 
  sessionTimeoutMinutes = 30 
}) => {
  const { user } = useAuth();
  const { extendSession } = useSessionTimeout(sessionTimeoutMinutes);
  const { moderateContent, trackProfileChange } = useSecurityMonitoring(user?.id);

  const value: SecurityContextType = {
    extendSession,
    moderateContent,
    trackProfileChange
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
};