import React, { useEffect } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Play, Settings } from 'lucide-react';

interface EnhancedOnboardingIntegrationProps {
  children: React.ReactNode;
  currentModule: string;
}

const EnhancedOnboardingIntegration: React.FC<EnhancedOnboardingIntegrationProps> = ({
  children,
  currentModule
}) => {
  const { 
    showAIAssistant, 
    isAIAssistantVisible, 
    startTour, 
    userRole, 
    markStepCompleted 
  } = useOnboarding();
  
  const { user, isDeveloper } = useAuth();

  // Auto-mark basic steps as completed when user visits a module
  useEffect(() => {
    if (user?.id) {
      const basicSteps = {
        dashboard: ['welcome', 'navigation'],
        projects: ['project_overview', 'navigation'],
        variations: ['variations_intro'],
        qa_itp: ['qa_welcome'],
        finance: ['finance_intro']
      };

      const steps = basicSteps[currentModule as keyof typeof basicSteps];
      if (steps) {
        steps.forEach(step => markStepCompleted(step));
      }
    }
  }, [currentModule, user?.id, markStepCompleted]);

  const getModuleDisplayName = (module: string) => {
    const names = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      variations: 'Variations',
      qa_itp: 'QA/ITP',
      finance: 'Finance',
      tasks: 'Tasks',
      rfis: 'RFIs',
      documents: 'Documents'
    };
    return names[module as keyof typeof names] || module;
  };

  const getRoleDisplayName = (role: string) => {
    const names = {
      project_manager: 'Project Manager',
      site_supervisor: 'Site Supervisor',
      estimator: 'Estimator',
      admin: 'Admin',
      org_admin: 'Organization Admin',
      subcontractor: 'Subcontractor',
      client: 'Client'
    };
    return names[role as keyof typeof names] || role;
  };

  return (
    <div className="relative">
      {children}
      
      {/* Onboarding Controls - Only show for authenticated users */}
      {user?.id && (
        <Card className="fixed bottom-4 left-4 w-80 shadow-lg z-40 border-primary/20" data-tour="onboarding-controls">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {getRoleDisplayName(userRole)}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {getModuleDisplayName(currentModule)}
                </Badge>
              </div>
              {isDeveloper() && (
                <Badge variant="destructive" className="text-xs">
                  Dev
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Need help? Use our guidance tools:
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showAIAssistant}
                  className="flex-1 text-xs"
                  data-tour="ai-assistant-btn"
                >
                  <HelpCircle className="h-3 w-3 mr-1" />
                  AI Help
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTour}
                  className="flex-1 text-xs"
                  data-tour="start-tour-btn"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Tour
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                👋 Welcome to {getModuleDisplayName(currentModule)}! 
                {userRole === 'project_manager' && ' As a PM, you have full access to all features.'}
                {userRole === 'site_supervisor' && ' Focus on QA and task management.'}
                {userRole === 'estimator' && ' Access finance tools and budget planning.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedOnboardingIntegration;