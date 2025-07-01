
import { usePermissionChecks } from '@/permissions';

export const useVariationEditPermissions = (variation: any) => {
  const { isDeveloper, canEdit, canAdmin, isProjectManager } = usePermissionChecks();

  // Users who can edit during pending approval (have approval workflow access)
  const canEditDuringPendingApproval = isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager();
  
  // Check if variation is in a locked status
  const isStatusLocked = ['approved', 'rejected'].includes(variation?.status);
  const isPendingApproval = variation?.status === 'pending_approval';
  
  // Determine if user can edit based on status and permissions
  const canEditVariation = () => {
    if (!variation) return false;
    
    // Developers and admins can always edit
    if (isDeveloper() || canAdmin('variations')) return true;
    
    // During pending approval, only users with approval permissions can edit
    if (isPendingApproval) {
      return canEditDuringPendingApproval;
    }
    
    // For other statuses, check normal edit permissions
    if (isStatusLocked) {
      return canEdit('variations') || isProjectManager();
    }
    
    return canEdit('variations') || isProjectManager();
  };

  const getEditBlockedReason = () => {
    if (!variation) return null;
    
    if (isPendingApproval && !canEditDuringPendingApproval) {
      return 'This variation is pending approval. Only users with approval workflow permissions can make changes.';
    }
    
    if (isStatusLocked && !canEditVariation()) {
      return `This variation is ${variation.status}. Only authorized users can make changes.`;
    }
    
    if (!canEdit('variations')) {
      return 'You do not have permission to edit variations.';
    }
    
    return null;
  };

  return {
    canEditVariation: canEditVariation(),
    canEditDuringPendingApproval,
    isStatusLocked,
    isPendingApproval,
    editBlockedReason: getEditBlockedReason()
  };
};
