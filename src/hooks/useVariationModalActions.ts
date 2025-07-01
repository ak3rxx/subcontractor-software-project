
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLoadingStateManager } from '@/hooks/useLoadingStateManager';
import { useAuditTrailManager } from '@/hooks/useAuditTrailManager';
import { Variation } from '@/types/variations';

interface UseVariationModalActionsProps {
  variation: Variation | null;
  canEditVariation: boolean;
  isStatusLocked: boolean;
  isPendingApproval: boolean;
  editBlockedReason: string | null;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

export const useVariationModalActions = ({
  variation,
  canEditVariation,
  isStatusLocked,
  isPendingApproval,
  editBlockedReason,
  onUpdate,
  onVariationUpdate
}: UseVariationModalActionsProps) => {
  const { toast } = useToast();
  const { executeWithLoading, getState } = useLoadingStateManager();
  const { debouncedRefresh } = useAuditTrailManager();

  const { loading: saveLoading } = getState(`variation-save-${variation?.id}`);

  const handleEdit = useCallback((setIsEditing: (value: boolean) => void, setShowConfirmDialog: (value: boolean) => void) => {
    if (!canEditVariation) {
      toast({
        title: "Edit Blocked",
        description: editBlockedReason || "You cannot edit this variation",
        variant: "destructive"
      });
      return;
    }

    if (isStatusLocked || isPendingApproval) {
      setShowConfirmDialog(true);
    } else {
      setIsEditing(true);
    }
  }, [canEditVariation, editBlockedReason, isStatusLocked, isPendingApproval, toast]);

  const handleSave = useCallback(async (
    editData: any, 
    setIsEditing: (value: boolean) => void, 
    setPendingChanges: (value: any) => void
  ) => {
    if (!onUpdate || !canEditVariation || !variation?.id) return;
    
    const success = await executeWithLoading(
      `variation-save-${variation.id}`,
      'saving',
      async () => {
        let updatePayload = { 
          ...editData,
          updated_by: variation?.updated_by,
          updated_at: new Date().toISOString()
        };
        
        if (isStatusLocked) {
          updatePayload.status = 'pending_approval';
        }

        await onUpdate(variation.id, updatePayload);

        if (onVariationUpdate) {
          onVariationUpdate({ ...variation, ...updatePayload });
        }

        debouncedRefresh(variation.id, 500);

        return updatePayload;
      },
      {
        errorAutoClearMs: 5000,
        onSuccess: () => {
          setIsEditing(false);
          setPendingChanges({});
          toast({
            title: "Success",
            description: "Variation updated successfully" + (isStatusLocked ? " (status reverted to pending approval)" : "")
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update variation",
            variant: "destructive"
          });
        }
      }
    );
  }, [variation, canEditVariation, isStatusLocked, onUpdate, onVariationUpdate, executeWithLoading, debouncedRefresh, toast]);

  return {
    handleEdit,
    handleSave,
    saveLoading
  };
};
