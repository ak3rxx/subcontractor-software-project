
import React from 'react';
import StatusBlockedMessage from '../approval/StatusBlockedMessage';

interface VariationStatusNotificationProps {
  canEditVariation: boolean;
  editBlockedReason: string | null;
  isPendingApproval: boolean;
  isStatusLocked: boolean;
}

const VariationStatusNotification: React.FC<VariationStatusNotificationProps> = ({
  canEditVariation,
  editBlockedReason,
  isPendingApproval,
  isStatusLocked
}) => {
  if (!canEditVariation && editBlockedReason) {
    return (
      <StatusBlockedMessage
        reason={editBlockedReason}
        isPendingApproval={isPendingApproval}
        isStatusLocked={isStatusLocked}
      />
    );
  }

  return null;
};

export default VariationStatusNotification;
