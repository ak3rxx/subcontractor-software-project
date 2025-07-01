
import React, { useCallback } from 'react';
import { useVariationEditPermissions } from '@/hooks/useVariationEditPermissions';
import { useVariationModal } from '@/hooks/useVariationModal';
import { useVariationModalActions } from '@/hooks/useVariationModalActions';
import VariationDetailsModalLayout from './modal/VariationDetailsModalLayout';

interface EnhancedVariationDetailsModalV2Props {
  variation: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

const EnhancedVariationDetailsModalV2: React.FC<EnhancedVariationDetailsModalV2Props> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate,
  onVariationUpdate
}) => {
  // Permission checks
  const {
    canEditVariation,
    isPendingApproval,
    isStatusLocked,
    editBlockedReason
  } = useVariationEditPermissions(variation);

  // Modal state management
  const {
    isEditing,
    setIsEditing,
    showConfirmDialog,
    setShowConfirmDialog,
    editData,
    pendingChanges,
    activeTab,
    setActiveTab,
    handleDataChange,
    resetEditState
  } = useVariationModal(variation);

  // Modal actions
  const {
    handleEdit,
    handleSave,
    saveLoading
  } = useVariationModalActions({
    variation,
    canEditVariation,
    isStatusLocked,
    isPendingApproval,
    editBlockedReason,
    onUpdate,
    onVariationUpdate
  });

  // Action handlers
  const onEdit = useCallback(() => {
    handleEdit(setIsEditing, setShowConfirmDialog);
  }, [handleEdit, setIsEditing, setShowConfirmDialog]);

  const onSave = useCallback(() => {
    handleSave(editData, setIsEditing, () => {});
  }, [handleSave, editData, setIsEditing]);

  const onCancel = useCallback(() => {
    resetEditState();
  }, [resetEditState]);

  const onConfirmEdit = useCallback(() => {
    setIsEditing(true);
    setShowConfirmDialog(false);
  }, [setIsEditing, setShowConfirmDialog]);

  const onCloseConfirmDialog = useCallback(() => {
    setShowConfirmDialog(false);
  }, [setShowConfirmDialog]);

  return (
    <VariationDetailsModalLayout
      isOpen={isOpen}
      onClose={onClose}
      variation={variation}
      // Modal state
      isEditing={isEditing}
      showConfirmDialog={showConfirmDialog}
      editData={editData}
      activeTab={activeTab}
      // Permissions
      canEditVariation={canEditVariation}
      editBlockedReason={editBlockedReason}
      isPendingApproval={isPendingApproval}
      isStatusLocked={isStatusLocked}
      // Actions
      saveLoading={saveLoading}
      onTabChange={setActiveTab}
      onDataChange={handleDataChange}
      onEdit={onEdit}
      onSave={onSave}
      onCancel={onCancel}
      onConfirmEdit={onConfirmEdit}
      onCloseConfirmDialog={onCloseConfirmDialog}
      onUpdate={onUpdate}
      onVariationUpdate={onVariationUpdate}
    />
  );
};

export default EnhancedVariationDetailsModalV2;
