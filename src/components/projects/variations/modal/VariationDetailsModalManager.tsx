
import React from 'react';
import { Variation } from '@/types/variations';
import EnhancedVariationDetailsModal from '../EnhancedVariationDetailsModal';
import VariationDetailsModal from '../../VariationDetailsModal';

interface VariationDetailsModalManagerProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
  useEnhanced?: boolean;
}

/**
 * Manager component that decides which modal to render based on feature flags or props
 */
const VariationDetailsModalManager: React.FC<VariationDetailsModalManagerProps> = ({
  variation,
  isOpen,
  onClose,
  onUpdate,
  onVariationUpdate,
  useEnhanced = true
}) => {
  if (useEnhanced) {
    return (
      <EnhancedVariationDetailsModal
        variation={variation}
        isOpen={isOpen}
        onClose={onClose}
        onUpdate={onUpdate}
        onVariationUpdate={onVariationUpdate}
      />
    );
  }

  return (
    <VariationDetailsModal
      variation={variation}
      isOpen={isOpen}
      onClose={onClose}
      onUpdate={onUpdate}
    />
  );
};

export default VariationDetailsModalManager;
