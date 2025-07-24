import { useState, useEffect } from 'react';

export type OnboardingStep = 'profile' | 'selfie' | 'guidelines' | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  completed: string[];
  startedAt: string;
}

export const useOnboardingState = (userId?: string) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 'profile',
    completed: [],
    startedAt: new Date().toISOString()
  });

  const storageKey = `onboarding_${userId}`;

  // Load state from localStorage on mount
  useEffect(() => {
    if (!userId) return;
    
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Only use saved state if it's recent (within 24 hours)
        const stateAge = Date.now() - new Date(parsedState.startedAt).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (stateAge < maxAge) {
          setState(parsedState);
        } else {
          // Clear old state
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
        localStorage.removeItem(storageKey);
      }
    }
  }, [userId, storageKey]);

  // Save state to localStorage when it changes
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, userId, storageKey]);

  const setCurrentStep = (step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  };

  const markStepCompleted = (step: string) => {
    setState(prev => ({
      ...prev,
      completed: [...prev.completed.filter(s => s !== step), step]
    }));
  };

  const isStepCompleted = (step: string) => {
    return state.completed.includes(step);
  };

  const clearState = () => {
    if (!userId) return;
    localStorage.removeItem(storageKey);
    setState({
      currentStep: 'profile',
      completed: [],
      startedAt: new Date().toISOString()
    });
  };

  return {
    currentStep: state.currentStep,
    completed: state.completed,
    startedAt: state.startedAt,
    setCurrentStep,
    markStepCompleted,
    isStepCompleted,
    clearState
  };
};