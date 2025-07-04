import React from 'react';
import { OnboardingProvider } from './OnboardingProvider';
import EnhancedOnboardingIntegration from './EnhancedOnboardingIntegration';
import { useLocation } from 'react-router-dom';

interface ProtectedOnboardingProviderProps {
  children: React.ReactNode;
}

const getModuleFromPath = (pathname: string): string => {
  if (pathname === '/' || pathname === '/auth' || pathname === '/subcontractor-onboarding') {
    return 'dashboard';
  }

  const pathMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/projects': 'projects',
    '/finance': 'finance',
    '/tasks': 'tasks',
    '/settings': 'settings'
  };

  if (pathname.includes('/projects/')) {
    if (pathname.includes('/variations')) return 'variations';
    if (pathname.includes('/qa-itp')) return 'qa_itp';
    if (pathname.includes('/finance')) return 'finance';
    if (pathname.includes('/programme')) return 'programme';
    if (pathname.includes('/tasks')) return 'tasks';
    if (pathname.includes('/rfis')) return 'rfis';
    if (pathname.includes('/documents')) return 'documents';
    return 'projects';
  }

  return pathMap[pathname] || 'dashboard';
};

export const ProtectedOnboardingProvider: React.FC<ProtectedOnboardingProviderProps> = ({ children }) => {
  const location = useLocation();
  const currentModule = getModuleFromPath(location.pathname);
  
  return (
    <OnboardingProvider>
      <EnhancedOnboardingIntegration currentModule={currentModule}>
        {children}
      </EnhancedOnboardingIntegration>
    </OnboardingProvider>
  );
};