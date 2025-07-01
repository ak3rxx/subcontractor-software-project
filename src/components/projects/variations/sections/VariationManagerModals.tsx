
import React from 'react';
import { Variation } from '@/types/variations';
import QuotationVariationForm from '../QuotationVariationForm';
import VariationDetailsModal from '../../VariationDetailsModal';

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
        <QuotationVariationForm
          key={formKey}
          projectName={projectName}
          onSubmit={onFormSubmit}
          onClose={onFormClose}
          editingVariation={editingVariation}
          isOpen={true}
        />
      )}

      {/* Variation Details Modal - Simplified to use core modal */}
      <VariationDetailsModal
        variation={selectedVariation}
        isOpen={showDetailsModal}
        onClose={onDetailsModalClose}
        onUpdate={onUpdateFromModal}
      />
    </>
  );
};

export default VariationManagerModals;
