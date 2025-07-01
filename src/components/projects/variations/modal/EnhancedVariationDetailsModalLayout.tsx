
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Variation } from '@/types/variations';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import { useVariationEditPermissions } from '@/hooks/useVariationEditPermissions';
import { useVariationModalActions } from '@/hooks/useVariationModalActions';
import VariationDetailsModalLayout from './VariationDetailsModalLayout';

interface EnhancedVariationDetailsModalLayoutProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

const EnhancedVariationDetailsModalLayout: React.FC<EnhancedVariationDetailsModalLayoutProps> = ({
  variation,
  isOpen,
  onClose,
  onUpdate,
  onVariationUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Modal state
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');

  // Permissions
  const {
    canEditVariation,
    editBlockedReason,
    isStatusLocked,
    isPendingApproval
  } = useVariationEditPermissions(variation);

  // Actions
  const {
    handleEdit: onEdit,
    handleSave: onSave,
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

  // Attachments
  const {
    attachments,
    loading: attachmentsLoading,
    fetchAttachments,
    downloadAttachment,
    deleteAttachment
  } = useVariationAttachments(variation?.id);

  // Initialize edit data when variation changes
  useEffect(() => {
    if (variation && isOpen) {
      setEditData({
        title: variation.title,
        description: variation.description || '',
        location: variation.location || '',
        cost_impact: variation.cost_impact,
        time_impact: variation.time_impact,
        category: variation.category || '',
        priority: variation.priority,
        client_email: variation.client_email || '',
        justification: variation.justification || ''
      });
      setPendingChanges({});
      fetchAttachments();
    }
  }, [variation, isOpen, fetchAttachments]);

  // Handle data changes
  const handleDataChange = (changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
    setPendingChanges(prev => ({ ...prev, ...changes }));
  };

  // Handle edit confirmation
  const handleConfirmEdit = () => {
    setShowConfirmDialog(false);
    setIsEditing(true);
  };

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  const handleEditAction = () => {
    onEdit(setIsEditing, setShowConfirmDialog);
  };

  const handleSaveAction = async () => {
    await onSave(editData, setIsEditing, setPendingChanges);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      title: variation?.title || '',
      description: variation?.description || '',
      location: variation?.location || '',
      cost_impact: variation?.cost_impact || 0,
      time_impact: variation?.time_impact || 0,
      category: variation?.category || '',
      priority: variation?.priority || 'medium',
      client_email: variation?.client_email || '',
      justification: variation?.justification || ''
    });
    setPendingChanges({});
  };

  if (!variation) return null;

  return (
    <VariationDetailsModalLayout
      isOpen={isOpen}
      onClose={onClose}
      variation={variation}
      isEditing={isEditing}
      showConfirmDialog={showConfirmDialog}
      editData={editData}
      activeTab={activeTab}
      canEditVariation={canEditVariation}
      editBlockedReason={editBlockedReason}
      isPendingApproval={isPendingApproval}
      isStatusLocked={isStatusLocked}
      saveLoading={saveLoading}
      onTabChange={setActiveTab}
      onDataChange={handleDataChange}
      onEdit={handleEditAction}
      onSave={handleSaveAction}
      onCancel={handleCancel}
      onConfirmEdit={handleConfirmEdit}
      onCloseConfirmDialog={handleCloseConfirmDialog}
      onUpdate={onUpdate}
      onVariationUpdate={onVariationUpdate}
    />
  );
};

export default EnhancedVariationDetailsModalLayout;
