
import React from 'react';
import PermissionGate from '@/components/PermissionGate';
import QuotationVariationForm from '../QuotationVariationForm';
import EnhancedVariationDetailsModalV2 from '../EnhancedVariationDetailsModalV2';
import { Variation } from '@/types/variations';

interface VariationManagerModalsProps {
  showForm: boolean;
  onFormClose: () => void;
  onFormSubmit: (data: any) => Promise<void>;
  projectName: string;
  editingVariation: Variation | null;
  formKey: number;
  selectedVariation: Variation | null;
  showDetailsModal: boolean;
  onDetailsModalClose: () => void;
  onUpdateFromModal: (id: string, updates: any) => Promise<void>;
  onVariationUpdate: (updatedVariation: Variation) => void;
}

const VariationManagerModals: React.FC<VariationManagerModalsProps> = ({
  showForm,
  onFormClose,
  onFormSubmit,
  projectName,
  editingVariation,
  formKey,
  selectedVariation,
  showDetailsModal,
  onDetailsModalClose,
  onUpdateFromModal,
  onVariationUpdate
}) => {
  return (
    <>
      <PermissionGate module="variations" requiredLevel="write">
        <QuotationVariationForm
          key={formKey}
          isOpen={showForm}
          onClose={onFormClose}
          onSubmit={onFormSubmit}
          projectName={projectName}
          editingVariation={editingVariation}
        />
      </PermissionGate>

      <EnhancedVariationDetailsModalV2
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={onDetailsModalClose}
        onUpdate={onUpdateFromModal}
        onVariationUpdate={onVariationUpdate}
      />
    </>
  );
};

export default VariationManagerModals;
