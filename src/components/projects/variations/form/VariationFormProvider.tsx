
import React, { createContext, useContext, useState, useCallback } from 'react';
import { VariationFormData } from '@/types/variations';
import { DEFAULT_VARIATION_FORM_DATA } from '@/constants/variations';
import { validateVariationForm } from '@/utils/variationTransforms';

interface VariationFormContextType {
  formData: VariationFormData;
  errors: string[];
  isValid: boolean;
  updateField: (field: keyof VariationFormData, value: any) => void;
  updateFields: (updates: Partial<VariationFormData>) => void;
  resetForm: (initialData?: Partial<VariationFormData>) => void;
  validateForm: () => boolean;
}

const VariationFormContext = createContext<VariationFormContextType | null>(null);

interface VariationFormProviderProps {
  children: React.ReactNode;
  initialData?: Partial<VariationFormData>;
  onDataChange?: (data: VariationFormData) => void;
}

export const VariationFormProvider: React.FC<VariationFormProviderProps> = ({
  children,
  initialData,
  onDataChange
}) => {
  const [formData, setFormData] = useState<VariationFormData>({
    ...DEFAULT_VARIATION_FORM_DATA,
    ...initialData
  });
  const [errors, setErrors] = useState<string[]>([]);

  const updateField = useCallback((field: keyof VariationFormData, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange?.(newData);
    
    // Clear errors when field is updated
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [formData, onDataChange, errors.length]);

  const updateFields = useCallback((updates: Partial<VariationFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onDataChange?.(newData);
    
    // Clear errors when fields are updated
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [formData, onDataChange, errors.length]);

  const resetForm = useCallback((newInitialData?: Partial<VariationFormData>) => {
    const resetData = {
      ...DEFAULT_VARIATION_FORM_DATA,
      ...newInitialData
    };
    setFormData(resetData);
    setErrors([]);
    onDataChange?.(resetData);
  }, [onDataChange]);

  const validateForm = useCallback(() => {
    const validationErrors = validateVariationForm(formData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [formData]);

  const value: VariationFormContextType = {
    formData,
    errors,
    isValid: errors.length === 0,
    updateField,
    updateFields,
    resetForm,
    validateForm
  };

  return (
    <VariationFormContext.Provider value={value}>
      {children}
    </VariationFormContext.Provider>
  );
};

export const useVariationForm = () => {
  const context = useContext(VariationFormContext);
  if (!context) {
    throw new Error('useVariationForm must be used within a VariationFormProvider');
  }
  return context;
};
