
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ApprovalDecisionSectionProps {
  showApprovalActions: boolean;
  approvalComments: string;
  setApprovalComments: (value: string) => void;
  rejectionReason: string;
  setRejectionReason: (value: string) => void;
  isSubmitting: boolean;
  onApproval: (approved: boolean) => void;
}

const ApprovalDecisionSection: React.FC<ApprovalDecisionSectionProps> = ({
  showApprovalActions,
  approvalComments,
  setApprovalComments,
  rejectionReason,
  setRejectionReason,
  isSubmitting,
  onApproval
}) => {
  if (!showApprovalActions) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-medium mb-4">Approval Decision</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="approval-comments">Approval Comments (Optional)</Label>
          <Textarea
            id="approval-comments"
            value={approvalComments}
            onChange={(e) => setApprovalComments(e.target.value)}
            placeholder="Add any comments about this approval..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rejection-reason">Rejection Reason</Label>
          <Textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this variation is being rejected..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={() => onApproval(true)}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? 'Processing...' : 'Approve'}
        </Button>
        
        <Button 
          onClick={() => onApproval(false)}
          disabled={isSubmitting || !rejectionReason.trim()}
          variant="destructive"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? 'Processing...' : 'Reject'}
        </Button>
      </div>
    </div>
  );
};

export default ApprovalDecisionSection;
