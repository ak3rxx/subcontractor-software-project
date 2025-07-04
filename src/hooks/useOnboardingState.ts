import { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingProgress {
  moduleId: string;
  isCompleted: boolean;
  showAgain: boolean;
  completedSteps: string[];
  currentStep?: string;
}

export const useOnboardingState = (moduleId: string) => {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('project_manager');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  const { user } = useSimpleAuth();

  useEffect(() => {
    const fetchOnboardingState = async () => {
      // Early return if no user - don't attempt database calls
      if (!user?.id) {
        setProgress({
          moduleId,
          isCompleted: false,
          showAgain: false, // Don't show onboarding for unauthenticated users
          completedSteps: [],
          currentStep: undefined
        });
        setLoading(false);
        return;
      }

      try {
        // Get user's organization and role
        const { data: orgUser } = await supabase
          .from('organization_users')
          .select('organization_id, role')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!orgUser) {
          setLoading(false);
          return;
        }

        setUserRole(orgUser.role);
        setOrganizationId(orgUser.organization_id);

        // Get onboarding state for this module
        const { data: onboardingState } = await supabase
          .from('onboarding_states')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', orgUser.organization_id)
          .eq('module_name', moduleId)
          .single();

        if (onboardingState) {
          setProgress({
            moduleId,
            isCompleted: onboardingState.is_completed || false,
            showAgain: onboardingState.show_again ?? true,
            completedSteps: onboardingState.completed_steps ? 
              (onboardingState.completed_steps as string[]) : [],
            currentStep: onboardingState.current_step || undefined
          });
        } else {
          // No onboarding state exists, create default
          setProgress({
            moduleId,
            isCompleted: false,
            showAgain: true,
            completedSteps: [],
            currentStep: undefined
          });
        }
      } catch (error) {
        console.error('Error fetching onboarding state:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingState();
  }, [user?.id, moduleId]);

  const updateProgress = async (updates: Partial<OnboardingProgress>) => {
    // Safe guard - don't attempt database updates without proper authentication
    if (!user?.id || !organizationId) {
      console.warn('Cannot update onboarding progress: user not authenticated or no organization');
      return;
    }

    const newProgress = { ...progress, ...updates } as OnboardingProgress;
    setProgress(newProgress);

    try {
      await supabase
        .from('onboarding_states')
        .upsert({
          user_id: user.id,
          organization_id: organizationId,
          role: userRole,
          module_name: moduleId,
          is_completed: newProgress.isCompleted,
          show_again: newProgress.showAgain,
          completed_steps: newProgress.completedSteps,
          current_step: newProgress.currentStep,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id,module_name'
        });
    } catch (error) {
      console.error('Error updating onboarding progress:', error);
    }
  };

  const markStepCompleted = (stepId: string) => {
    if (!progress) return;
    
    const completedSteps = [...progress.completedSteps];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }
    
    updateProgress({ 
      completedSteps,
      currentStep: stepId
    });
  };

  const markModuleCompleted = () => {
    updateProgress({ 
      isCompleted: true, 
      showAgain: false 
    });
  };

  const resetOnboarding = () => {
    updateProgress({ 
      isCompleted: false, 
      showAgain: true, 
      completedSteps: [],
      currentStep: undefined
    });
  };

  const shouldShowOnboarding = () => {
    if (!progress) return false;
    return progress.showAgain && !progress.isCompleted;
  };

  const shouldShowInteractiveTour = () => {
    // Don't show tour for unauthenticated users
    if (!user?.id || !progress) return false;
    return progress.showAgain && !progress.isCompleted;
  };

  return {
    progress,
    loading,
    userRole,
    organizationId,
    updateProgress,
    markStepCompleted,
    markModuleCompleted,
    resetOnboarding,
    shouldShowOnboarding,
    shouldShowInteractiveTour
  };
};