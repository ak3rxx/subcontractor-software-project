
import React from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface SubmitForApprovalSectionProps {
  canSubmitForApproval: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

const SubmitForApprovalSection: React.FC<SubmitForApprovalSectionProps> = ({
  canSubmitForApproval,
  isSubmitting,
  onSubmit
}) => {
  if (!canSubmitForApproval) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium mb-2">Submit for Approval</h4>
      <p className="text-sm text-gray-600 mb-4">
        Once submitted, this variation will be sent to the approval team for review. 
        You will not be able to edit the variation while it's under review.
      </p>
      <Button 
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex items-center gap-2"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
      </Button>
    </div>
  );
};

export default SubmitForApprovalSection;
