
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Send, Unlock, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

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
  const canApprove = isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager;
  const canUnlock = isDeveloper() || canAdmin('variations') || isProjectManager;
  const canSubmitForApproval = variation.status === 'draft' && (isDeveloper() || canEdit('variations') || isProjectManager);
  const showApprovalActions = canApprove && variation.status === 'pending_approval';
  const showUnlockActions = canUnlock && ['approved', 'rejected'].includes(variation.status);

  const handleSubmitForApproval = async () => {
    if (!canSubmitForApproval || isBlocked) {
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

  const handleApproval = async (approved: boolean) => {
    if (!canApprove || isBlocked) {
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
        approved_by: user?.email || user?.id,
        approval_date: new Date().toISOString().split('T')[0],
        approval_comments: approved ? approvalComments : rejectionReason,
        updated_by: user?.id
      };

      await onUpdate(variation.id, updateData);
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
        description: "Failed to update variation status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = async () => {
    if (!canUnlock || isBlocked) {
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
      onStatusChange();
      
      toast({
        title: "Success",
        description: `Variation unlocked and reverted to ${unlockTargetStatus}`
      });
      
      // Clear form
      setUnlockReason('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unlock variation",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBlocked) {
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
  }

  return (
    <div className="space-y-6">
      {/* Submit for Approval */}
      {canSubmitForApproval && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium mb-2">Submit for Approval</h4>
          <p className="text-sm text-gray-600 mb-4">
            Once submitted, this variation will be sent to the approval team for review. 
            You will not be able to edit the variation while it's under review.
          </p>
          <Button 
            onClick={handleSubmitForApproval}
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
      )}

      {/* Approval Actions */}
      {showApprovalActions && (
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
              onClick={() => handleApproval(true)}
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
              onClick={() => handleApproval(false)}
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
      )}

      {/* Unlock Section */}
      {showUnlockActions && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium mb-2 text-orange-700 flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            Unlock {variation.status === 'approved' ? 'Approved' : 'Rejected'} Variation
            {isProjectManager && " (Project Manager Override)"}
          </h4>
          
          <div className="bg-orange-100 p-3 rounded-lg mb-4">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This will unlock the {variation.status} variation and revert it to draft status. 
              The variation can then be edited and resubmitted. This action creates an audit trail.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="unlock-target">Revert To</Label>
              <Select value={unlockTargetStatus} onValueChange={(value: 'draft') => setUnlockTargetStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (Editable)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlock-reason">Unlock Reason *</Label>
              <Textarea
                id="unlock-reason"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="Explain why you are unlocking this variation..."
                rows={3}
              />
            </div>
          </div>

          <Button 
            onClick={handleUnlock}
            disabled={isSubmitting || !unlockReason.trim()}
            variant="outline"
            className="border-orange-500 text-orange-700 hover:bg-orange-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Unlock className="h-4 w-4 mr-2" />
            )}
            {isSubmitting ? 'Processing...' : 'Unlock & Revert to Draft'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default VariationApprovalActions;
