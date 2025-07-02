
import React from 'react';
import { Variation } from '@/types/variations';
import QuotationVariationForm from '../QuotationVariationForm';
import VariationDetailsModalLayout from '../modal/VariationDetailsModalLayout';

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

      {/* Enhanced Variation Details Modal with Tabs, Audit Trail, and Approval Workflow */}
      <VariationDetailsModalLayout
        isOpen={showDetailsModal}
        onClose={onDetailsModalClose}
        variation={selectedVariation}
        onUpdate={onUpdateFromModal}
        onVariationUpdate={onVariationUpdate}
      />
    </>
  );
};

export default VariationManagerModals;
