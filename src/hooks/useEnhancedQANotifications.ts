import { useCallback } from 'react';
import { useSmartNotifications } from './useSmartNotifications';

export interface QAUploadState {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  currentFile?: string;
}

export interface QAFormProgress {
  totalFields: number;
  completedFields: number;
  completedSections: string[];
  nextRequiredField?: string;
}

export const useEnhancedQANotifications = () => {
  const {
    createQAUploadProgress,
    createQAUploadSuccess,
    createQAUploadError,
    createQAValidationWarning,
    createQAFormMilestone,
    createQAContextualHelp,
    createQAProcessGuide,
    markAsDismissed
  } = useSmartNotifications();

  // File Upload Notifications
  const notifyUploadStart = useCallback((fileName: string, queuePosition: number, totalFiles: number) => {
    return createQAUploadProgress(fileName, queuePosition, totalFiles);
  }, [createQAUploadProgress]);

  const notifyUploadProgress = useCallback((fileName: string, progress: number, total: number) => {
    return createQAUploadProgress(fileName, progress, total);
  }, [createQAUploadProgress]);

  const notifyUploadSuccess = useCallback((fileName: string, fileUrl?: string) => {
    return createQAUploadSuccess(fileName, fileUrl);
  }, [createQAUploadSuccess]);

  const notifyUploadError = useCallback((fileName: string, error: string, retryAction?: () => void) => {
    const notificationId = createQAUploadError(fileName, error);
    // If retry action is provided, enhance the notification
    if (retryAction) {
      // The retry action will be handled by the component
      console.log('Retry action available for:', fileName);
    }
    return notificationId;
  }, [createQAUploadError]);

  const notifyUploadQueueComplete = useCallback((totalFiles: number, failedCount: number) => {
    if (failedCount === 0) {
      return createQAFormMilestone(
        'Upload Complete',
        `All ${totalFiles} files uploaded successfully`,
        'upload-queue'
      );
    } else {
      return createQAValidationWarning(
        'Upload Issues',
        `${totalFiles - failedCount}/${totalFiles} files uploaded successfully. ${failedCount} failed.`,
        'upload-queue'
      );
    }
  }, [createQAFormMilestone, createQAValidationWarning]);

  // Form Validation & Progress Notifications
  const notifyFieldValidation = useCallback((fieldName: string, isValid: boolean, message?: string) => {
    if (!isValid && message) {
      return createQAValidationWarning(fieldName, message);
    }
    return null;
  }, [createQAValidationWarning]);

  const notifyFormMilestone = useCallback((milestone: string, description: string) => {
    return createQAFormMilestone(milestone, description);
  }, [createQAFormMilestone]);

  const notifyMissingFields = useCallback((missingFields: string[], focusAction?: (field: string) => void) => {
    const fieldList = missingFields.slice(0, 3).join(', ');
    const moreText = missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : '';
    
    return createQAValidationWarning(
      'Required Fields',
      `Please complete: ${fieldList}${moreText}`,
      'form-validation'
    );
  }, [createQAValidationWarning]);

  // Contextual Help & Guidance
  const notifyTemplateHelp = useCallback((templateType: string) => {
    const helpMap: Record<string, { title: string; message: string }> = {
      'doors-jambs-hardware': {
        title: 'Door Installation Inspection',
        message: 'Focus on alignment, hardware functionality, and fire rating compliance. Check for gaps, smooth operation, and proper sealing.'
      },
      'skirting': {
        title: 'Skirting Installation Inspection',
        message: 'Verify straight lines, secure fixing, consistent gaps, and proper corner joints. Check for defects and finish quality.'
      }
    };

    const help = helpMap[templateType];
    if (help) {
      return createQAContextualHelp(help.title, help.message);
    }
    return null;
  }, [createQAContextualHelp]);

  const notifyProcessStage = useCallback((stage: string, nextSteps: string, actions?: Array<{ label: string; action: () => void }>) => {
    return createQAProcessGuide(stage, nextSteps);
  }, [createQAProcessGuide]);

  const notifyFirstTimeUser = useCallback(() => {
    return createQAContextualHelp(
      'Welcome to QA Inspections',
      'Start by selecting a project and template type. We\'ll guide you through each step of creating a comprehensive inspection.',
      [{
        label: 'View Tutorial',
        action: () => {
          // This could trigger an interactive tutorial
          console.log('Tutorial action triggered');
        }
      }]
    );
  }, [createQAContextualHelp]);

  // Smart Form Assistance
  const notifySmartSuggestion = useCallback((suggestion: string, context: string) => {
    return createQAContextualHelp(
      'Smart Suggestion',
      `${context}: ${suggestion}`,
      [{
        label: 'Apply Suggestion',
        action: () => {
          console.log('Smart suggestion applied:', suggestion);
        }
      }]
    );
  }, [createQAContextualHelp]);

  const notifyBestPractice = useCallback((practice: string, reason: string) => {
    return createQAContextualHelp(
      'Best Practice Tip',
      `${practice} - ${reason}`,
      [{
        label: 'Learn More',
        action: () => {
          console.log('Best practice info requested:', practice);
        }
      }]
    );
  }, [createQAContextualHelp]);

  // Error Recovery & Troubleshooting
  const notifyRecoveryAction = useCallback((error: string, recoverySteps: string[], autoFix?: () => void) => {
    return createQAValidationWarning(
      'Recovery Assistance',
      `${error} - ${recoverySteps.join(', ')}`,
      'error-recovery'
    );
  }, [createQAValidationWarning]);

  const notifyDataLoss = useCallback((data: string, recoveryAction?: () => void) => {
    return createQAValidationWarning(
      'Data Recovery',
      `${data} may be lost. We can attempt to recover it.`,
      'data-recovery'
    );
  }, [createQAValidationWarning]);

  const notifyAutoSave = useCallback((fileCount: number) => {
    return createQAFormMilestone(
      'Auto-saved',
      `${fileCount} files saved to draft`,
      'autosave'
    );
  }, [createQAFormMilestone]);

  return {
    // Upload notifications
    notifyUploadStart,
    notifyUploadProgress,
    notifyUploadSuccess,
    notifyUploadError,
    notifyUploadQueueComplete,
    
    // Form validation
    notifyFieldValidation,
    notifyFormMilestone,
    notifyMissingFields,
    
    // Contextual help
    notifyTemplateHelp,
    notifyProcessStage,
    notifyFirstTimeUser,
    
    // Smart assistance
    notifySmartSuggestion,
    notifyBestPractice,
    
    // Error recovery
    notifyRecoveryAction,
    notifyDataLoss,
    
    // Auto-save
    notifyAutoSave,
    
    // Utility
    markAsDismissed
  };
};