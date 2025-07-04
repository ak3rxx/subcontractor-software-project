import React, { createContext, useContext, useState, useEffect } from 'react';
import AIAssistant from './AIAssistant';
import InteractiveTour from './InteractiveTour';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useLocation } from 'react-router-dom';

interface OnboardingContextType {
  currentModule: string;
  showAIAssistant: () => void;
  hideAIAssistant: () => void;
  isAIAssistantVisible: boolean;
  startTour: () => void;
  userRole: string;
  markStepCompleted: (stepId: string) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

const getModuleFromPath = (pathname: string): string => {
  // Only handle authenticated routes - return default for public routes
  if (pathname === '/' || pathname === '/auth' || pathname === '/subcontractor-onboarding') {
    return 'dashboard'; // Default module for public routes
  }

  const pathMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/projects': 'projects',
    '/finance': 'finance',
    '/tasks': 'tasks',
    '/settings': 'settings'
  };

  // Check for nested paths
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

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const location = useLocation();
  const currentModule = getModuleFromPath(location.pathname);
  
  const [isAIAssistantVisible, setIsAIAssistantVisible] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  const { 
    progress, 
    userRole, 
    markStepCompleted, 
    shouldShowInteractiveTour,
    markModuleCompleted 
  } = useOnboardingState(currentModule);

  // Auto-show tour for new modules
  useEffect(() => {
    if (shouldShowInteractiveTour()) {
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1000); // Delay to let page load

      return () => clearTimeout(timer);
    }
  }, [currentModule, shouldShowInteractiveTour]);

  const showAIAssistant = () => {
    setIsAIAssistantVisible(true);
  };

  const hideAIAssistant = () => {
    setIsAIAssistantVisible(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
    markModuleCompleted();
  };

  const handleTourSkip = () => {
    setShowTour(false);
  };

  const contextValue: OnboardingContextType = {
    currentModule,
    showAIAssistant,
    hideAIAssistant,
    isAIAssistantVisible,
    startTour,
    userRole,
    markStepCompleted
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* AI Assistant */}
      <AIAssistant
        currentModule={currentModule}
        userContext={{
          completedSteps: progress?.completedSteps || [],
          currentStep: progress?.currentStep
        }}
        isVisible={isAIAssistantVisible}
        onToggle={() => setIsAIAssistantVisible(!isAIAssistantVisible)}
      />
      
      {/* Interactive Tour */}
      {showTour && (
        <InteractiveTour
          moduleId={currentModule}
          userRole={userRole}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </OnboardingContext.Provider>
  );
};