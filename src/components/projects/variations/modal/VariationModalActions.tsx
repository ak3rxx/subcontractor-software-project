
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, X, Save } from 'lucide-react';
import PermissionGate from '@/components/PermissionGate';

interface VariationModalActionsProps {
  isEditing: boolean;
  canEditVariation: boolean;
  saveLoading: boolean;
  activeTab: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const VariationModalActions: React.FC<VariationModalActionsProps> = ({
  isEditing,
  canEditVariation,
  saveLoading,
  activeTab,
  onEdit,
  onSave,
  onCancel
}) => {
  return (
    <div className="flex-shrink-0 border-t pt-4">
      {!isEditing && activeTab !== 'approval' && (
        <div className="flex justify-end">
          <PermissionGate permission="edit" showMessage={false}>
            <Button 
              variant="outline" 
              onClick={onEdit}
              disabled={!canEditVariation}
            >
              <Edit className="h-4 w-4 mr-2" />
              {!canEditVariation ? 'Edit Blocked' : 'Edit Variation'}
            </Button>
          </PermissionGate>
        </div>
      )}
      
      {isEditing && canEditVariation && (
        <PermissionGate permission="edit" showMessage={false}>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={saveLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saveLoading}>
              <Save className="h-4 w-4 mr-2" />
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </PermissionGate>
      )}
    </div>
  );
};

export default VariationModalActions;
