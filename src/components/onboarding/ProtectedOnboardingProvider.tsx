import React from 'react';
import { OnboardingProvider } from './OnboardingProvider';

interface ProtectedOnboardingProviderProps {
  children: React.ReactNode;
}

export const ProtectedOnboardingProvider: React.FC<ProtectedOnboardingProviderProps> = ({ children }) => {
  // Since this is only used within ProtectedRoute, we know user is authenticated
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  );
};