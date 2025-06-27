
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ApprovalBlockedMessage: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <div>
          <h4 className="font-medium text-yellow-800">Approval Actions Blocked</h4>
          <p className="text-sm text-yellow-700">
            Please save or cancel your changes before using the approval workflow.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApprovalBlockedMessage;
