
import React from 'react';
import { Variation } from '@/types/variations';
import VariationForm from '../VariationForm';
import VariationDetailsModalManager from '../modal/VariationDetailsModalManager';

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
      {/* Variation Form Modal */}
      {showForm && (
        <VariationForm
          key={formKey}
          projectName={projectName}
          onSubmit={onFormSubmit}
          onCancel={onFormClose}
          initialData={editingVariation}
          isEditing={!!editingVariation}
        />
      )}

      {/* Variation Details Modal */}
      <VariationDetailsModalManager
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={onDetailsModalClose}
        onUpdate={onUpdateFromModal}
        onVariationUpdate={onVariationUpdate}
        useEnhanced={true}
      />
    </>
  );
};

export default VariationManagerModals;
