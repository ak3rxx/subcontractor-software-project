
import React from 'react';
import { AlertTriangle, Lock, Clock } from 'lucide-react';

interface StatusBlockedMessageProps {
  reason: string;
  isPendingApproval?: boolean;
  isStatusLocked?: boolean;
}

const StatusBlockedMessage: React.FC<StatusBlockedMessageProps> = ({
  reason,
  isPendingApproval = false,
  isStatusLocked = false
}) => {
  const getIcon = () => {
    if (isPendingApproval) return <Clock className="h-5 w-5 text-yellow-600" />;
    if (isStatusLocked) return <Lock className="h-5 w-5 text-red-600" />;
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  };

  const getBgColor = () => {
    if (isPendingApproval) return 'bg-yellow-50 border-yellow-200';
    if (isStatusLocked) return 'bg-red-50 border-red-200';
    return 'bg-amber-50 border-amber-200';
  };

  const getTextColor = () => {
    if (isPendingApproval) return 'text-yellow-800';
    if (isStatusLocked) return 'text-red-800';
    return 'text-amber-800';
  };

  return (
    <div className={`${getBgColor()} border rounded-md p-4 mb-4`}>
      <div className="flex items-center gap-2">
        {getIcon()}
        <div>
          <h4 className={`font-medium ${getTextColor()}`}>
            {isPendingApproval ? 'Pending Approval - Editing Restricted' : 
             isStatusLocked ? 'Status Locked' : 'Editing Blocked'}
          </h4>
          <p className={`text-sm ${getTextColor()}`}>
            {reason}
          </p>
          {isPendingApproval && (
            <p className={`text-xs mt-1 ${getTextColor()}`}>
              Users with approval workflow permissions can still make changes if needed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBlockedMessage;
