
import React from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import VariationModalHeader from './VariationModalHeader';
import VariationModalTabs from './VariationModalTabs';
import VariationModalActions from './VariationModalActions';
import VariationStatusNotification from './VariationStatusNotification';
import EditConfirmationDialog from '../EditConfirmationDialog';

interface VariationDetailsModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  variation: any;
  // Modal state
  isEditing: boolean;
  showConfirmDialog: boolean;
  editData: any;
  activeTab: string;
  // Permissions
  canEditVariation: boolean;
  editBlockedReason: string | null;
  isPendingApproval: boolean;
  isStatusLocked: boolean;
  // Actions
  saveLoading: boolean;
  onTabChange: (tab: string) => void;
  onDataChange: (changes: any) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onConfirmEdit: () => void;
  onCloseConfirmDialog: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

const VariationDetailsModalLayout: React.FC<VariationDetailsModalLayoutProps> = ({
  isOpen,
  onClose,
  variation,
  isEditing,
  showConfirmDialog,
  editData,
  activeTab,
  canEditVariation,
  editBlockedReason,
  isPendingApproval,
  isStatusLocked,
  saveLoading,
  onTabChange,
  onDataChange,
  onEdit,
  onSave,
  onCancel,
  onConfirmEdit,
  onCloseConfirmDialog,
  onUpdate,
  onVariationUpdate
}) => {
  if (!variation) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <VariationModalHeader
              variation={variation}
              isStatusLocked={isStatusLocked}
              isPendingApproval={isPendingApproval}
            />
          </DialogHeader>

          <VariationStatusNotification
            canEditVariation={canEditVariation}
            editBlockedReason={editBlockedReason}
            isPendingApproval={isPendingApproval}
            isStatusLocked={isStatusLocked}
          />

          <VariationModalTabs
            variation={variation}
            editData={editData}
            isEditing={isEditing}
            canEditVariation={canEditVariation}
            activeTab={activeTab}
            onTabChange={onTabChange}
            onDataChange={onDataChange}
            onUpdate={onUpdate}
            onVariationUpdate={onVariationUpdate}
          />

          <VariationModalActions
            isEditing={isEditing}
            canEditVariation={canEditVariation}
            saveLoading={saveLoading}
            activeTab={activeTab}
            onEdit={onEdit}
            onSave={onSave}
            onCancel={onCancel}
          />
        </DialogContent>
      </Dialog>

      <EditConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={onCloseConfirmDialog}
        onConfirm={onConfirmEdit}
        variationStatus={variation?.status || ''}
        variationNumber={variation?.variation_number || ''}
      />
    </>
  );
};

export default VariationDetailsModalLayout;
