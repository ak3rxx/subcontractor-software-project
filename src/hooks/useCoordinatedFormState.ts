import { useState, useRef, useCallback, useEffect } from 'react';
import { useFormAutoSave } from './useFormAutoSave';
import { useQAUploadManager, QAUploadedFile } from './useQAUploadManager';
import { useEnhancedQANotifications } from './useEnhancedQANotifications';

interface CoordinatedFormOptions {
  formKey: string;
  projectId?: string;
  autoSaveInterval?: number;
  enableValidation?: boolean;
}

export interface FormValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export const useCoordinatedFormState = <T extends Record<string, any>>(
  initialData: T,
  options: CoordinatedFormOptions
) => {
  const { formKey, projectId, autoSaveInterval = 30000, enableValidation = true } = options;
  
  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<FormValidationError[]>([]);
  const [formLocked, setFormLocked] = useState(false);
  
  const qaNotifications = useEnhancedQANotifications();
  const submitAttemptRef = useRef(0);
  
  // Upload manager with coordinated state
  const uploadManager = useQAUploadManager({
    folder: `inspections/${projectId || 'temp'}`,
    enableAutoSave: true,
    autoSaveInterval
  });

  // Auto-save with conflict resolution
  const autoSave = useFormAutoSave(
    { ...formData, uploadedFiles: uploadManager.uploadedFiles },
    {
      key: formKey,
      interval: autoSaveInterval,
      enabled: !isSubmitting && !formLocked,
      onSave: (data) => {
        qaNotifications.notifyAutoSave(Object.keys(data).length);
      },
      onRestore: (data) => {
        if (data.formData) {
          setFormData(data.formData);
        } else {
          setFormData(data);
        }
        qaNotifications.notifyFormMilestone('Form Restored', 'Previous work restored from auto-save');
      }
    }
  );

  // Coordinated form data update
  const updateFormData = useCallback((field: keyof T | Partial<T>, value?: any) => {
    if (formLocked) {
      qaNotifications.notifyFieldValidation(
        typeof field === 'string' ? field : 'Form',
        false,
        'Form is locked during submission'
      );
      return;
    }

    setFormData(prev => {
      if (typeof field === 'object') {
        return { ...prev, ...field };
      }
      return { ...prev, [field]: value };
    });

    // Clear validation errors for this field
    if (typeof field === 'string') {
      setValidationErrors(prev => prev.filter(error => error.field !== field));
    }
  }, [formLocked, qaNotifications]);

  // Form validation
  const validateForm = useCallback((requiredFields: string[] = [], isDraft = false): boolean => {
    if (!enableValidation) return true;

    const errors: FormValidationError[] = [];

    // Check required fields only for non-draft submissions
    if (!isDraft) {
      requiredFields.forEach(field => {
        const value = formData[field as keyof T];
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push({
            field,
            message: `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`,
            severity: 'error'
          });
        }
      });
    }

    // Check for upload issues
    if (uploadManager.isUploading) {
      errors.push({
        field: 'uploads',
        message: 'Please wait for file uploads to complete',
        severity: 'warning'
      });
    }

    if (uploadManager.hasFailures) {
      errors.push({
        field: 'uploads',
        message: 'Some file uploads failed. Please retry or remove failed files.',
        severity: 'error'
      });
    }

    setValidationErrors(errors);

    // Show user-friendly validation feedback
    if (errors.length > 0) {
      const firstError = errors[0];
      qaNotifications.notifyFieldValidation(
        firstError.field,
        false,
        firstError.message
      );
      
      // Focus first error field
      const element = document.getElementById(`qa-${firstError.field}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => element.focus(), 500);
      }
    }

    return errors.filter(e => e.severity === 'error').length === 0;
  }, [formData, enableValidation, uploadManager.isUploading, uploadManager.hasFailures, qaNotifications]);

  // Atomic submission with rollback capability
  const submitForm = useCallback(async (
    submitHandler: (data: T, files: QAUploadedFile[]) => Promise<boolean>,
    requiredFields: string[] = [],
    isDraft = false
  ) => {
    if (isSubmitting) {
      qaNotifications.notifyProcessStage('Already Submitting', 'Please wait for the current submission to complete');
      return false;
    }

    if (!validateForm(requiredFields, isDraft)) {
      return false;
    }

    submitAttemptRef.current += 1;
    const attemptNumber = submitAttemptRef.current;

    setIsSubmitting(true);
    setFormLocked(true);

    // Save current state for rollback
    const rollbackData = { ...formData };
    const rollbackFiles = [...uploadManager.uploadedFiles];

    try {
      qaNotifications.notifyProcessStage(
        isDraft ? 'Saving Draft' : 'Submitting Form',
        'Please wait while we process your submission'
      );

      // Wait for any pending uploads
      while (uploadManager.isUploading) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const success = await submitHandler(formData, uploadManager.completedFiles);

      if (success) {
        // Clear auto-save data on successful submission
        autoSave.clearSavedData();
        
        qaNotifications.notifyFormMilestone(
          isDraft ? 'Draft Saved' : 'Form Submitted',
          isDraft ? 'Your progress has been saved' : 'Submission completed successfully'
        );
        
        return true;
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error(`Form submission attempt ${attemptNumber} failed:`, error);
      
      // Rollback on failure
      setFormData(rollbackData);
      
      qaNotifications.notifyRecoveryAction(
        'Submission Failed',
        [
          'Your submission could not be completed',
          'Your data has been preserved',
          'Check your internet connection',
          'Try submitting again'
        ]
      );
      
      return false;
    } finally {
      setIsSubmitting(false);
      setFormLocked(false);
    }
  }, [formData, isSubmitting, validateForm, uploadManager, autoSave, qaNotifications]);

  // Form recovery utilities
  const recoverFromError = useCallback(() => {
    setIsSubmitting(false);
    setFormLocked(false);
    setValidationErrors([]);
    qaNotifications.notifyFormMilestone('Form Recovered', 'You can continue editing your form');
  }, [qaNotifications]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setValidationErrors([]);
    setIsSubmitting(false);
    setFormLocked(false);
    autoSave.clearSavedData();
    uploadManager.clearAllFiles();
  }, [initialData, autoSave, uploadManager]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = autoSave.loadFromLocalStorage();
    if (savedData && savedData.formData) {
      setFormData(savedData.formData);
    }
  }, [autoSave]);

  return {
    // Form state
    formData,
    isSubmitting,
    formLocked,
    validationErrors,
    
    // Upload state
    uploadManager,
    
    // Auto-save state
    autoSave,
    
    // Actions
    updateFormData,
    validateForm,
    submitForm,
    recoverFromError,
    resetForm,
    
    // Computed values
    hasErrors: validationErrors.filter(e => e.severity === 'error').length > 0,
    hasWarnings: validationErrors.filter(e => e.severity === 'warning').length > 0,
    isReady: !isSubmitting && !formLocked && !uploadManager.isUploading,
    canSubmit: !isSubmitting && !formLocked && validationErrors.filter(e => e.severity === 'error').length === 0
  };
};