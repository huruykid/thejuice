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
        setState(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse onboarding state:', error);
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