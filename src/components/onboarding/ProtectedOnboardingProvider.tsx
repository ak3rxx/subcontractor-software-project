import React from 'react';
import { OnboardingProvider } from './OnboardingProvider';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedOnboardingProviderProps {
  children: React.ReactNode;
}

export const ProtectedOnboardingProvider: React.FC<ProtectedOnboardingProviderProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Only wrap with OnboardingProvider if user is authenticated
  if (loading) {
    return <>{children}</>;
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  );
};