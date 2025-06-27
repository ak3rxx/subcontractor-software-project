
import React from 'react';
import { useApprovalActions } from './approval/useApprovalActions';
import SubmitForApprovalSection from './approval/SubmitForApprovalSection';
import ApprovalDecisionSection from './approval/ApprovalDecisionSection';
import UnlockVariationSection from './approval/UnlockVariationSection';
import ApprovalBlockedMessage from './approval/ApprovalBlockedMessage';

interface VariationApprovalActionsProps {
  variation: any;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onStatusChange: () => void;
  isBlocked?: boolean;
}

const VariationApprovalActions: React.FC<VariationApprovalActionsProps> = ({
  variation,
  onUpdate,
  onStatusChange,
  isBlocked = false
}) => {
  const {
    approvalComments,
    setApprovalComments,
    rejectionReason,
    setRejectionReason,
    unlockReason,
    setUnlockReason,
    unlockTargetStatus,
    setUnlockTargetStatus,
    isSubmitting,
    permissions,
    isProjectManager,
    handleSubmitForApproval,
    handleApproval,
    handleUnlock
  } = useApprovalActions(variation, onUpdate, onStatusChange);

  if (isBlocked) {
    return <ApprovalBlockedMessage />;
  }

  return (
    <div className="space-y-6">
      <SubmitForApprovalSection
        canSubmitForApproval={permissions.canSubmitForApproval}
        isSubmitting={isSubmitting}
        onSubmit={() => handleSubmitForApproval(isBlocked)}
      />

      <ApprovalDecisionSection
        showApprovalActions={permissions.showApprovalActions}
        approvalComments={approvalComments}
        setApprovalComments={setApprovalComments}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        isSubmitting={isSubmitting}
        onApproval={(approved) => handleApproval(approved, isBlocked)}
      />

      <UnlockVariationSection
        showUnlockActions={permissions.showUnlockActions}
        variation={variation}
        isProjectManager={isProjectManager}
        unlockReason={unlockReason}
        setUnlockReason={setUnlockReason}
        unlockTargetStatus={unlockTargetStatus}
        setUnlockTargetStatus={setUnlockTargetStatus}
        isSubmitting={isSubmitting}
        onUnlock={() => handleUnlock(isBlocked)}
      />
    </div>
  );
};

export default VariationApprovalActions;
