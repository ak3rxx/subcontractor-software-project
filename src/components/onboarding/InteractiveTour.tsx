import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft, ArrowRight, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'highlight' | 'form_fill';
    element?: string;
    value?: string;
  };
}

interface InteractiveTourProps {
  moduleId: string;
  userRole: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

const roleBasedTours: Record<string, Record<string, TourStep[]>> = {
  project_manager: {
    projects: [
      {
        id: 'welcome',
        title: 'Welcome to Projects',
        description: 'As a Project Manager, this is your central hub for overseeing all construction projects. Let\'s explore the key features.',
      },
      {
        id: 'create-project',
        title: 'Create Your First Project',
        description: 'Click the "New Project" button to start setting up a construction project.',
        target: '[data-tour="new-project-btn"]',
        position: 'bottom',
        action: { type: 'highlight', element: '[data-tour="new-project-btn"]' }
      },
      {
        id: 'project-overview',
        title: 'Project Overview',
        description: 'View project status, budget summary, and key milestones at a glance.',
        target: '[data-tour="project-cards"]',
        position: 'top'
      },
      {
        id: 'team-management',
        title: 'Team Management',
        description: 'Assign team members, track responsibilities, and manage project access.',
        target: '[data-tour="team-section"]',
        position: 'left'
      }
    ],
    variations: [
      {
        id: 'variations-intro',
        title: 'Managing Variations',
        description: 'Track and approve project changes that impact cost or timeline.',
      },
      {
        id: 'variation-approval',
        title: 'Approval Workflow',
        description: 'Review pending variations and approve or reject changes.',
        target: '[data-tour="pending-variations"]',
        position: 'bottom'
      },
      {
        id: 'cost-impact',
        title: 'Cost Impact Analysis',
        description: 'Monitor how variations affect your project budget.',
        target: '[data-tour="cost-summary"]',
        position: 'top'
      }
    ]
  },
  site_supervisor: {
    qa_itp: [
      {
        id: 'qa-welcome',
        title: 'Quality Assurance',
        description: 'Conduct inspections, upload photos, and ensure compliance with project standards.',
      },
      {
        id: 'start-inspection',
        title: 'Start an Inspection',
        description: 'Begin a new QA inspection for your current work area.',
        target: '[data-tour="new-inspection-btn"]',
        position: 'bottom',
        action: { type: 'highlight', element: '[data-tour="new-inspection-btn"]' }
      },
      {
        id: 'upload-photos',
        title: 'Upload Evidence',
        description: 'Take and upload photos to document compliance and quality.',
        target: '[data-tour="photo-upload"]',
        position: 'left'
      },
      {
        id: 'checklist-completion',
        title: 'Complete Checklists',
        description: 'Work through inspection items systematically.',
        target: '[data-tour="checklist-items"]',
        position: 'right'
      }
    ]
  },
  estimator: {
    finance: [
      {
        id: 'finance-intro',
        title: 'Financial Management',
        description: 'Create budgets, track costs, and analyze financial performance.',
      },
      {
        id: 'create-budget',
        title: 'Create Project Budget',
        description: 'Set up detailed cost breakdowns by trade and category.',
        target: '[data-tour="new-budget-btn"]',
        position: 'bottom'
      },
      {
        id: 'cost-tracking',
        title: 'Track Actual Costs',
        description: 'Monitor spending against budget in real-time.',
        target: '[data-tour="cost-tracker"]',
        position: 'top'
      },
      {
        id: 'forecasting',
        title: 'Budget Forecasting',
        description: 'Predict final costs based on current trends.',
        target: '[data-tour="forecast-panel"]',
        position: 'left'
      }
    ]
  }
};

const InteractiveTour: React.FC<InteractiveTourProps> = ({
  moduleId,
  userRole,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const tourSteps = roleBasedTours[userRole]?.[moduleId] || [];

  useEffect(() => {
    const checkShouldShow = async () => {
      if (!user?.id || tourSteps.length === 0) return;

      try {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!orgUser) return;

        const { data: onboardingState } = await supabase
          .from('onboarding_states')
          .select('is_completed, show_again')
          .eq('user_id', user.id)
          .eq('organization_id', orgUser.organization_id)
          .eq('module_name', moduleId)
          .single();

        if (!onboardingState || (onboardingState.show_again && !onboardingState.is_completed)) {
          setIsVisible(true);
        }
      } catch (error) {
        console.error('Error checking onboarding state:', error);
      }
    };

    checkShouldShow();
  }, [user?.id, moduleId, tourSteps.length]);

  useEffect(() => {
    if (!isVisible || !tourSteps[currentStep]?.target) return;

    const updateTargetPosition = () => {
      const target = document.querySelector(tourSteps[currentStep].target!) as HTMLElement;
      if (target) {
        setTargetElement(target);
        const rect = target.getBoundingClientRect();
        const position = tourSteps[currentStep].position || 'bottom';
        
        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top - 10;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 10;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 10;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 10;
            break;
        }

        setTooltipPosition({ top, left });
        
        // Add highlight to target element
        target.style.position = 'relative';
        target.style.zIndex = '1001';
        target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        target.style.borderRadius = '8px';
      }
    };

    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
      
      // Remove highlight
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [currentStep, isVisible, tourSteps, targetElement]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      if (user?.id) {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (orgUser) {
          await supabase.rpc('update_onboarding_module_progress', {
            p_user_id: user.id,
            p_organization_id: orgUser.organization_id,
            p_module_name: moduleId,
            p_completed: true,
            p_show_again: false
          });
        }
      }
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }

    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = async () => {
    try {
      if (user?.id) {
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (orgUser) {
          await supabase.rpc('update_onboarding_module_progress', {
            p_user_id: user.id,
            p_organization_id: orgUser.organization_id,
            p_module_name: moduleId,
            p_completed: false,
            p_show_again: false
          });
        }
      }
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }

    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || tourSteps.length === 0) return null;

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Dark overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-[1000]"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Tour tooltip */}
      <Card 
        className="fixed z-[1002] w-80 shadow-2xl"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6 -mt-1 -mr-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <Progress value={progress} className="mb-3" />
          
          <h3 className="font-semibold text-sm mb-2">{currentTourStep.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {currentTourStep.description}
          </p>
          
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
              >
                Skip Tour
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="flex items-center gap-1"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default InteractiveTour;