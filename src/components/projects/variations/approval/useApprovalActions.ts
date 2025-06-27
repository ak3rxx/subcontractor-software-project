
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

export const useApprovalActions = (variation: any, onUpdate: (id: string, updates: any) => Promise<void>, onStatusChange: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin } = usePermissions();
  
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockTargetStatus, setUnlockTargetStatus] = useState<'draft'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRole = user?.role || 'user';
  const isProjectManager = userRole === 'project_manager';

  const permissions = {
    canApprove: isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager,
    canUnlock: isDeveloper() || canAdmin('variations') || isProjectManager,
    canSubmitForApproval: variation.status === 'draft' && (isDeveloper() || canEdit('variations') || isProjectManager),
    showApprovalActions: (isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager) && variation.status === 'pending_approval',
    showUnlockActions: (isDeveloper() || canAdmin('variations') || isProjectManager) && ['approved', 'rejected'].includes(variation.status)
  };

  const handleSubmitForApproval = async (isBlocked: boolean) => {
    if (!permissions.canSubmitForApproval || isBlocked) {
      toast({
        title: "Access Denied",
        description: isBlocked ? "Please save changes first" : "You don't have permission to submit variations for approval",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        status: 'pending_approval' as const,
        request_date: new Date().toISOString().split('T')[0],
        requested_by: user?.id,
        updated_by: user?.id
      };
      
      await onUpdate(variation.id, updateData);
      
      // Immediate callback to trigger refreshes
      onStatusChange();
      
      toast({
        title: "Success",
        description: "Variation submitted for approval",
        duration: 3000
      });
      
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast({
        title: "Error",
        description: `Failed to submit variation for approval: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (approved: boolean, isBlocked: boolean) => {
    if (!permissions.canApprove || isBlocked) {
      toast({
        title: "Access Denied",
        description: isBlocked ? "Please save changes first" : "You don't have permission to approve variations",
        variant: "destructive"
      });
      return;
    }

    if (!approved && !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this variation",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        status: approved ? 'approved' : 'rejected',
        approved_by: user?.id,
        approval_date: new Date().toISOString().split('T')[0],
        approval_comments: approved ? approvalComments : rejectionReason,
        updated_by: user?.id
      };

      console.log('Updating variation with:', updateData);

      await onUpdate(variation.id, updateData);
      
      // Immediate callback to trigger refreshes
      onStatusChange();
      
      toast({
        title: "Success",
        description: `Variation ${approved ? 'approved' : 'rejected'} successfully`
      });
      
      // Clear form
      setApprovalComments('');
      setRejectionReason('');
    } catch (error) {
      console.error('Error updating approval:', error);
      toast({
        title: "Error",
        description: `Failed to update variation status: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async (isBlocked: boolean) => {
    if (!permissions.canUnlock || isBlocked) {
      toast({
        title: "Access Denied",
        description: isBlocked ? "Please save changes first" : "You don't have permission to unlock variations",
        variant: "destructive"
      });
      return;
    }

    if (!unlockReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for unlocking this variation",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const unlockComment = `UNLOCKED by ${user?.email || 'user'} on ${new Date().toLocaleDateString()}: ${unlockReason}`;
      const previousComment = variation.approval_comments ? `\n\nPrevious comments: ${variation.approval_comments}` : '';
      
      const updateData = {
        status: unlockTargetStatus,
        approved_by: null,
        approval_date: null,
        approval_comments: unlockComment + previousComment,
        updated_by: user?.id
      };

      await onUpdate(variation.id, updateData);
      
      // Immediate callback to trigger refreshes
      onStatusChange();
      
      toast({
        title: "Success",
        description: `Variation unlocked and reverted to ${unlockTargetStatus}`
      });
      
      // Clear form
      setUnlockReason('');
    } catch (error) {
      console.error('Error unlocking variation:', error);
      toast({
        title: "Error",
        description: `Failed to unlock variation: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    approvalComments,
    setApprovalComments,
    rejectionReason,
    setRejectionReason,
    unlockReason,
    setUnlockReason,
    unlockTargetStatus,
    setUnlockTargetStatus,
    isSubmitting,
    
    // Permissions
    permissions,
    isProjectManager,
    
    // Actions
    handleSubmitForApproval,
    handleApproval,
    handleUnlock
  };
};
