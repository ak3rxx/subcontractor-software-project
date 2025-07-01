
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useVariationAuditTrail } from '@/hooks/useVariationAuditTrail';

export const useApprovalActions = (
  variation: any, 
  onUpdate: (id: string, updates: any) => Promise<void>, 
  onStatusChange: () => void
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin } = usePermissions();
  const { refetch } = useVariationAuditTrail(variation?.id);
  
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockTargetStatus, setUnlockTargetStatus] = useState<'draft'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<{success: boolean; message: string} | null>(null);

  const userRole = user?.role || 'user';
  const isProjectManager = userRole === 'project_manager';

  const permissions = {
    canApprove: isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager,
    canUnlock: isDeveloper() || canAdmin('variations') || isProjectManager,
    canSubmitForApproval: variation.status === 'draft' && (isDeveloper() || canEdit('variations') || isProjectManager),
    showApprovalActions: (isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager) && variation.status === 'pending_approval',
    showUnlockActions: (isDeveloper() || canAdmin('variations') || isProjectManager) && ['approved', 'rejected'].includes(variation.status)
  };

  // Enhanced action handler with better error handling and immediate feedback
  const executeActionWithFeedback = async (
    actionName: string,
    actionFn: () => Promise<void>,
    successMessage: string
  ) => {
    setIsSubmitting(true);
    setLastActionResult(null);
    
    try {
      console.log(`Starting ${actionName} action...`);
      await actionFn();
      
      console.log(`${actionName} completed successfully`);
      setLastActionResult({ success: true, message: successMessage });
      
      toast({
        title: "Success",
        description: successMessage,
        duration: 3000
      });

      // Trigger immediate status change callback and audit refresh
      console.log('Triggering status change callback and audit refresh...');
      await Promise.all([
        onStatusChange(),
        refetch()
      ]);
      
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setLastActionResult({ success: false, message: errorMessage });
      
      toast({
        title: "Error",
        description: `Failed to ${actionName.toLowerCase()}: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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

    await executeActionWithFeedback(
      'Submit for Approval',
      async () => {
        const updateData = {
          status: 'pending_approval' as const,
          request_date: new Date().toISOString().split('T')[0],
          requested_by: user?.id,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        };
        
        console.log('Submitting for approval with data:', updateData);
        
        // Database trigger will handle audit logging automatically
        await onUpdate(variation.id, updateData);
      },
      'Variation submitted for approval'
    );
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

    await executeActionWithFeedback(
      approved ? 'Approve Variation' : 'Reject Variation',
      async () => {
        const updateData = {
          status: approved ? 'approved' : 'rejected',
          approved_by: user?.id,
          approval_date: new Date().toISOString().split('T')[0],
          approval_comments: approved ? approvalComments : rejectionReason,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        };

        console.log('Updating variation approval with:', updateData);

        // Database trigger will handle audit logging automatically
        await onUpdate(variation.id, updateData);
        
        // Clear form
        setApprovalComments('');
        setRejectionReason('');
      },
      `Variation ${approved ? 'approved' : 'rejected'} successfully`
    );
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

    await executeActionWithFeedback(
      'Unlock Variation',
      async () => {
        const unlockComment = `UNLOCKED by ${user?.email || 'user'} on ${new Date().toLocaleDateString()}: ${unlockReason}`;
        const previousComment = variation.approval_comments ? `\n\nPrevious comments: ${variation.approval_comments}` : '';
        
        const updateData = {
          status: unlockTargetStatus,
          approved_by: null,
          approval_date: null,
          approval_comments: unlockComment + previousComment,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        };

        console.log('Unlocking variation with data:', updateData);

        // Database trigger will handle audit logging automatically
        await onUpdate(variation.id, updateData);
        
        // Clear form
        setUnlockReason('');
      },
      `Variation unlocked and reverted to ${unlockTargetStatus}`
    );
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
    lastActionResult,
    
    // Permissions
    permissions,
    isProjectManager,
    
    // Actions
    handleSubmitForApproval,
    handleApproval,
    handleUnlock
  };
};
