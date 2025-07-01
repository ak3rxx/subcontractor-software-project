
import React from 'react';
import { Variation } from '@/types/variations';
import EnhancedVariationDetailsModalLayout from './modal/EnhancedVariationDetailsModalLayout';

interface EnhancedVariationDetailsModalProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

/**
 * Enhanced Variation Details Modal - Refactored for better maintainability
 * This component now serves as a simple wrapper around the new layout system
 */
const EnhancedVariationDetailsModal: React.FC<EnhancedVariationDetailsModalProps> = (props) => {
  return <EnhancedVariationDetailsModalLayout {...props} />;
};

export default EnhancedVariationDetailsModal;
