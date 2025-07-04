
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, Send, MessageSquare, User, Calendar, RotateCcw } from 'lucide-react';
import { useSimplePermissions } from '@/hooks/useSimplePermissions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import PermissionGate from '@/components/PermissionGate';

interface VariationApprovalWorkflowProps {
  variation: any;
  onUpdate: (id: string, updates: any) => Promise<void>;
}

const VariationApprovalWorkflow: React.FC<VariationApprovalWorkflowProps> = ({
  variation,
  onUpdate
}) => {
  const { toast } = useToast();
  const { canEdit, canAdmin } = useSimplePermissions();
  const { user } = useAuth();
  const isDeveloper = () => user?.email === 'huy.nguyen@dcsquared.com.au';
  const userProfile = user;
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [retractionReason, setRetractionReason] = useState('');
  const [retractionStatus, setRetractionStatus] = useState<'draft' | 'rejected'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced permission checks using the permission system
  const canApprove = isDeveloper() || canAdmin() || canEdit();
  const canRetract = (isDeveloper() || canAdmin()) && variation.status === 'approved';
  const canSubmitForApproval = variation.status === 'draft' && (isDeveloper() || canEdit());
  const showApprovalActions = canApprove && variation.status === 'pending_approval';

  console.log('Permission check:', {
    userProfile,
    isDeveloper: isDeveloper(),
    canEdit: canEdit(),
    canAdmin: canAdmin(),
    canApprove,
    canRetract,
    canSubmitForApproval,
    showApprovalActions,
    variationStatus: variation.status
  });

  const handleSubmitForApproval = async () => {
    if (!canSubmitForApproval) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to submit variations for approval",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting variation for approval, current status:', variation.status);
      
      const updateData = {
        status: 'pending_approval' as const,
        request_date: new Date().toISOString().split('T')[0],
        requested_by: userProfile?.id
      };
      
      console.log('Update data being sent:', updateData);
      
      await onUpdate(variation.id, updateData);
      
      toast({
        title: "Success",
        description: "Variation submitted for approval"
      });
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast({
        title: "Error",
        description: "Failed to submit variation for approval",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!canApprove) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to approve variations",
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
        approved_by: userProfile?.id,
        approval_date: new Date().toISOString().split('T')[0],
        approval_comments: approved ? approvalComments : rejectionReason
      };

      await onUpdate(variation.id, updateData);
      
      toast({
        title: "Success",
        description: `Variation ${approved ? 'approved' : 'rejected'} successfully`
      });
      
      // Clear form
      setApprovalComments('');
      setRejectionReason('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variation status",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetraction = async () => {
    if (!canRetract) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to retract approvals",
        variant: "destructive"
      });
      return;
    }

    if (!retractionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for retracting the approval",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        status: retractionStatus,
        approved_by: null,
        approval_date: null,
        approval_comments: `RETRACTED: ${retractionReason} | Previous approval comments: ${variation.approval_comments || 'None'}`
      };

      await onUpdate(variation.id, updateData);
      
      toast({
        title: "Success",
        description: `Approval retracted and variation reverted to ${retractionStatus}`
      });
      
      // Clear form
      setRetractionReason('');
      setRetractionStatus('draft');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retract approval",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkflowStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'pending_approval':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getWorkflowSteps = () => {
    const steps = [
      { 
        key: 'draft', 
        label: 'Draft', 
        icon: MessageSquare,
        completed: ['pending_approval', 'approved', 'rejected'].includes(variation.status),
        active: variation.status === 'draft'
      },
      { 
        key: 'pending_approval', 
        label: 'Pending Approval', 
        icon: Clock,
        completed: ['approved', 'rejected'].includes(variation.status),
        active: variation.status === 'pending_approval'
      },
      { 
        key: 'final', 
        label: variation.status === 'approved' ? 'Approved' : variation.status === 'rejected' ? 'Rejected' : 'Final Decision', 
        icon: variation.status === 'approved' ? CheckCircle : variation.status === 'rejected' ? XCircle : User,
        completed: ['approved', 'rejected'].includes(variation.status),
        active: false
      }
    ];
    
    return steps;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Approval Workflow</span>
          {getWorkflowStatusBadge(variation.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Workflow Steps */}
        <div className="flex items-center justify-between">
          {getWorkflowSteps().map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-100 border-green-500 text-green-700' 
                    : step.active 
                    ? 'bg-blue-100 border-blue-500 text-blue-700' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="ml-3 hidden md:block">
                  <div className={`text-sm font-medium ${
                    step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                </div>
                {index < getWorkflowSteps().length - 1 && (
                  <div className={`h-px w-12 ml-6 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Submission Section */}
        <PermissionGate>
          {canSubmitForApproval && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Ready to Submit for Approval?</h4>
              <p className="text-sm text-gray-600">
                Once submitted, this variation will be sent to the approval team for review. 
                You will not be able to edit the variation while it's under review.
              </p>
              <Button 
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </div>
          )}
        </PermissionGate>

        {/* Approval Actions */}
        {showApprovalActions && (
          <PermissionGate permission="approve" showMessage={true} message="Only Project Managers and Org Admins can approve variations.">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Approval Decision</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Approval Comments */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="approval-comments">Approval Comments (Optional)</Label>
                  <Textarea
                    id="approval-comments"
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                    placeholder="Add any comments about this approval..."
                    rows={3}
                    className="flex-1"
                  />
                </div>

                {/* Rejection Reason */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this variation is being rejected..."
                    rows={3}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  onClick={() => handleApproval(true)}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Processing...' : 'Approve'}
                </Button>
                
                <Button 
                  onClick={() => handleApproval(false)}
                  disabled={isSubmitting || !rejectionReason.trim()}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </div>
          </PermissionGate>
        )}

        {/* Retraction Section - Only for Admin Level Users */}
        {canRetract && (
          <PermissionGate permission="admin" showMessage={true} message="Only administrators can retract approved variations.">
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-orange-700">Retract Approval (Admin Only)</h4>
                <p className="text-sm text-gray-600">
                  This will retract the approval and revert the variation to the selected status. 
                  This action should only be used when necessary.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="retraction-status">Revert To</Label>
                    <Select value={retractionStatus} onValueChange={(value: 'draft' | 'rejected') => setRetractionStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="retraction-reason">Retraction Reason *</Label>
                    <Textarea
                      id="retraction-reason"
                      value={retractionReason}
                      onChange={(e) => setRetractionReason(e.target.value)}
                      placeholder="Explain why you are retracting this approval..."
                      rows={3}
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleRetraction}
                  disabled={isSubmitting || !retractionReason.trim()}
                  variant="outline"
                  className="border-orange-500 text-orange-700 hover:bg-orange-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Processing...' : 'Retract Approval'}
                </Button>
              </div>
            </>
          </PermissionGate>
        )}

        {/* Current Status Info */}
        {variation.status !== 'draft' && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Status Information</h4>
            <div className="bg-gray-50 p-3 rounded-md space-y-2">
              {variation.request_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Submitted:</span>
                  <span>{variation.request_date}</span>
                </div>
              )}
              
              {variation.approved_by && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Reviewed by:</span>
                  <span>{variation.approved_by}</span>
                </div>
              )}
              
              {variation.approval_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Decision date:</span>
                  <span>{variation.approval_date}</span>
                </div>
              )}
              
              {variation.approval_comments && (
                <div className="space-y-1">
                  <span className="font-medium text-sm">Comments:</span>
                  <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                    {variation.approval_comments}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VariationApprovalWorkflow;
