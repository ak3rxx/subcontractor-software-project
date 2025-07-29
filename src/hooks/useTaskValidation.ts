import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationErrors {
  url_link?: string;
  drawing_number?: string;
  title?: string;
  due_date?: string;
}

export const useTaskValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValidating, setIsValidating] = useState(false);

  // FIXED: Memoize validation functions to prevent re-renders
  const validateUrl = useCallback((url: string): boolean => {
    if (!url) return true; // Empty URL is valid
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const validateDrawingNumber = useCallback(async (drawingNumber: string, projectId?: string): Promise<boolean> => {
    // Always allow any text or blank values for drawing numbers
    return true;
  }, []);

  const validateRequired = useCallback((value: string, fieldName: string): boolean => {
    const isValid = value && value.trim().length > 0;
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${fieldName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName as keyof ValidationErrors];
        return newErrors;
      });
    }
    return isValid;
  }, []);

  const validateDueDate = useCallback((value: string, isNewTask: boolean = false): boolean => {
    if (!value) return true; // Empty due date is valid
    
    const dueDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Only validate future dates for new tasks, allow past dates for existing tasks
    if (isNewTask && dueDate < today) {
      setErrors(prev => ({
        ...prev,
        due_date: 'Due date cannot be in the past'
      }));
      return false;
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.due_date;
        return newErrors;
      });
      return true;
    }
  }, []);

  const validateField = useCallback(async (fieldName: string, value: string, projectId?: string, isNewTask: boolean = false): Promise<boolean> => {
    let isValid = true;

    switch (fieldName) {
      case 'url_link':
        isValid = validateUrl(value);
        setErrors(prev => ({
          ...prev,
          url_link: isValid ? undefined : 'Please enter a valid URL (including http:// or https://)'
        }));
        break;

      case 'drawing_number':
        if (value && projectId) {
          isValid = await validateDrawingNumber(value, projectId);
          setErrors(prev => ({
            ...prev,
            drawing_number: isValid ? undefined : 'Drawing number not found in project documents'
          }));
        }
        break;

      case 'title':
        isValid = validateRequired(value, 'title');
        break;

      case 'due_date':
        isValid = validateDueDate(value, isNewTask);
        break;

      default:
        break;
    }

    return isValid;
  }, [validateUrl, validateDrawingNumber, validateRequired, validateDueDate]);

  const validateAllFields = useCallback(async (data: any, projectId?: string, isNewTask: boolean = false): Promise<boolean> => {
    const validations = await Promise.all([
      validateField('title', data.title || '', projectId, isNewTask),
      validateField('url_link', data.url_link || '', projectId, isNewTask),
      validateField('drawing_number', data.drawing_number || '', projectId, isNewTask),
      validateField('due_date', data.due_date || '', projectId, isNewTask)
    ]);

    return validations.every(Boolean);
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const getFieldError = useCallback((fieldName: keyof ValidationErrors): string | undefined => {
    return errors[fieldName];
  }, [errors]);

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    isValidating,
    validateField,
    validateAllFields,
    clearErrors,
    getFieldError,
    hasErrors
  };
};