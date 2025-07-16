import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Play, SkipForward } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
  type: 'info' | 'action' | 'warning' | 'tip';
  actionRequired?: boolean;
  validationCheck?: () => boolean;
}

interface QAOnboardingTourProps {
  isVisible: boolean;
  userRole?: string;
  onComplete?: () => void;
  onSkip?: () => void;
  onStepComplete?: (stepId: string) => void;
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  beginner: [
    {
      id: 'welcome',
      title: 'Welcome to QA Inspections',
      content: 'This tour will guide you through creating your first quality assurance inspection. Follow along to learn the key features.',
      target: 'body',
      position: 'bottom',
      type: 'info'
    },
    {
      id: 'project_info',
      title: 'Project Information',
      content: 'Start by entering your project details. Make sure the project name matches your project management system.',
      target: '[name="project_name"]',
      position: 'bottom',
      type: 'action',
      actionRequired: true,
      validationCheck: () => {
        const input = document.querySelector('[name="project_name"]') as HTMLInputElement;
        return input?.value?.trim().length > 0;
      }
    },
    {
      id: 'template_selection',
      title: 'Choose Inspection Template',
      content: 'Select the appropriate template for your inspection type. Different templates have different checklists.',
      target: '[name="template_type"]',
      position: 'bottom',
      type: 'action',
      actionRequired: true
    },
    {
      id: 'checklist_overview',
      title: 'Inspection Checklist',
      content: 'This is where you\'ll complete your inspection items. Each item can be marked as Pass, Fail, or N/A with comments and photos.',
      target: '.checklist-container',
      position: 'top',
      type: 'info'
    },
    {
      id: 'file_uploads',
      title: 'Evidence Documentation',
      content: 'Upload photos and documents as evidence. You can drag and drop files or click to select them.',
      target: '.file-upload-area',
      position: 'top',
      type: 'tip'
    },
    {
      id: 'save_progress',
      title: 'Save Your Work',
      content: 'Your progress is automatically saved every 30 seconds. You can also save manually or as a draft.',
      target: '.save-buttons',
      position: 'top',
      type: 'tip'
    },
    {
      id: 'completion',
      title: 'Complete Your Inspection',
      content: 'Once all items are reviewed, add your digital signature and submit the inspection.',
      target: '.signature-section',
      position: 'top',
      type: 'action'
    }
  ],
  experienced: [
    {
      id: 'advanced_features',
      title: 'Advanced Features',
      content: 'Quick overview of advanced features for experienced users.',
      target: 'body',
      position: 'bottom',
      type: 'info'
    },
    {
      id: 'bulk_actions',
      title: 'Bulk Operations',
      content: 'Use Ctrl+Click to select multiple checklist items for bulk status updates.',
      target: '.checklist-container',
      position: 'top',
      type: 'tip'
    },
    {
      id: 'keyboard_shortcuts',
      title: 'Keyboard Shortcuts',
      content: 'Press Ctrl+S to save, Ctrl+Enter to submit, and Tab to navigate between fields quickly.',
      target: 'body',
      position: 'bottom',
      type: 'tip'
    }
  ]
};

const QAOnboardingTour: React.FC<QAOnboardingTourProps> = ({
  isVisible,
  userRole = 'beginner',
  onComplete,
  onSkip,
  onStepComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  const steps = TOUR_STEPS[userRole] || TOUR_STEPS.beginner;
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    if (isVisible) {
      setIsActive(true);
      highlightTarget(currentStep?.target);
    } else {
      setIsActive(false);
      removeHighlights();
    }

    return () => removeHighlights();
  }, [isVisible, currentStep]);

  const highlightTarget = (selector: string) => {
    removeHighlights();
    
    if (selector === 'body') return;
    
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add('tour-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const removeHighlights = () => {
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  };

  const canProceed = () => {
    if (!currentStep?.actionRequired) return true;
    if (!currentStep?.validationCheck) return true;
    return currentStep.validationCheck();
  };

  const handleNext = () => {
    if (currentStep?.actionRequired && !canProceed()) {
      toast({
        title: "Action Required",
        description: "Please complete the required action before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setCompletedSteps(prev => new Set(prev).add(currentStep.id));
    onStepComplete?.(currentStep.id);

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    removeHighlights();
    setIsActive(false);
    onSkip?.();
  };

  const handleComplete = () => {
    removeHighlights();
    setIsActive(false);
    toast({
      title: "Tour Completed!",
      description: "You've completed the QA inspection onboarding tour.",
    });
    onComplete?.();
  };

  const getStepTypeColor = (type: TourStep['type']) => {
    switch (type) {
      case 'action':
        return 'default';
      case 'warning':
        return 'destructive';
      case 'tip':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStepIcon = (type: TourStep['type']) => {
    switch (type) {
      case 'action':
        return <Play className="h-4 w-4" />;
      case 'warning':
        return '⚠️';
      case 'tip':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  if (!isActive || !currentStep) return null;

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" />
      
      {/* Tour Card */}
      <Card className="fixed top-4 right-4 w-80 z-50 shadow-2xl border-2">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={getStepTypeColor(currentStep.type)} className="text-xs">
                {getStepIcon(currentStep.type)}
                {currentStep.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {currentStepIndex + 1} of {steps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <Progress value={progress} className="w-full h-2" />

          {/* Content */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">{currentStep.title}</h3>
            <p className="text-sm text-muted-foreground">{currentStep.content}</p>

            {currentStep.actionRequired && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary font-medium">
                  Action Required: Complete this step to continue
                </p>
                {!canProceed() && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Waiting for you to complete the required action...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Skip Tour
              </Button>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              disabled={currentStep.actionRequired && !canProceed()}
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSS for highlighting */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 41;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  );
};

export default QAOnboardingTour;