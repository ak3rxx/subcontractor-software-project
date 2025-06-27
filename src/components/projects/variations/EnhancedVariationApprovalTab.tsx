import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, XCircle, Clock, Send, MessageSquare, User, Calendar, 
  RotateCcw, AlertTriangle, Unlock, History, FileText, Loader2, Edit 
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useVariationAuditTrail } from '@/hooks/useVariationAuditTrail';

interface EnhancedVariationApprovalTabProps {
  variation: any;
  onUpdate: (id: string, updates: any) => Promise<void>;
  isBlocked: boolean;
}

const EnhancedVariationApprovalTab: React.FC<EnhancedVariationApprovalTabProps> = ({
  variation,
  onUpdate,
  isBlocked
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isDeveloper, canEdit, canAdmin, userProfile } = usePermissions();
  const { auditTrail, loading: auditLoading, refetch: refetchAudit, logAuditEntry } = useVariationAuditTrail(variation?.id);
  
  const [approvalComments, setApprovalComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockTargetStatus, setUnlockTargetStatus] = useState<'draft'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enhanced permission checks - Project Managers can now retract/unlock
  const userRole = user?.role || 'user';
  const isProjectManager = userRole === 'project_manager';
  const canApprove = isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager;
  const canUnlock = isDeveloper() || canAdmin('variations') || isProjectManager;
  const canSubmitForApproval = variation.status === 'draft' && (isDeveloper() || canEdit('variations') || isProjectManager);
  const showApprovalActions = canApprove && variation.status === 'pending_approval';
  const showUnlockActions = canUnlock && ['approved', 'rejected'].includes(variation.status);

  // Filter audit trail to show only approval-related events
  const approvalHistory = useMemo(() => {
    return auditTrail.filter(entry => 
      ['create', 'submit', 'approve', 'reject', 'unlock', 'email_sent'].includes(entry.action_type)
    );
  }, [auditTrail]);

  // Single useEffect for variation changes - no automatic refresh
  useEffect(() => {
    if (variation?.id && auditTrail.length === 0 && !auditLoading) {
      console.log('Initial audit trail fetch for variation:', variation.id);
      refetchAudit();
    }
  }, [variation?.id]); // Only depend on variation.id

  const handleSubmitForApproval = async () => {
    if (!canSubmitForApproval || isBlocked) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to submit variations for approval or there are unsaved changes",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Starting submit for approval process');
      console.log('Current variation status:', variation.status);
      console.log('User info:', { userId: user?.id, userEmail: user?.email, userProfile });
      
      // Use user.id directly instead of userProfile.id
      const updateData = {
        status: 'pending_approval' as const,
        request_date: new Date().toISOString().split('T')[0],
        requested_by: user?.id  // Fixed: use user.id instead of userProfile?.id
      };
      
      console.log('Submitting update data:', updateData);
      
      // Call the update function and wait for completion
      await onUpdate(variation.id, updateData);
      
      console.log('Database update completed successfully');
      
      // Log the submission - but don't block on it
      try {
        await logAuditEntry('submit', {
          statusFrom: 'draft',
          statusTo: 'pending_approval',
          comments: `Variation submitted for approval by ${user?.email || 'user'}`
        });
        console.log('Audit entry logged successfully');
      } catch (auditError) {
        console.warn('Failed to log audit entry, but continuing:', auditError);
      }
      
      // Refresh audit trail after a brief delay to allow for database consistency
      setTimeout(() => {
        console.log('Refreshing audit trail after submission');
        refetchAudit();
      }, 1000);
      
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
        description: "You don't have permission to approve variations or there are unsaved changes",
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
        approved_by: user?.email || user?.id, // Fixed: use user email or id
        approval_date: new Date().toISOString().split('T')[0],
        approval_comments: approved ? approvalComments : rejectionReason
      };

      console.log('Processing approval decision:', updateData);
      await onUpdate(variation.id, updateData);
      
      // Log the approval/rejection - but don't block on it
      try {
        await logAuditEntry(approved ? 'approve' : 'reject', {
          statusFrom: 'pending_approval',
          statusTo: approved ? 'approved' : 'rejected',
          comments: approved ? approvalComments : rejectionReason
        });
      } catch (auditError) {
        console.warn('Failed to log audit entry, but continuing:', auditError);
      }
      
      // Refresh audit trail
      setTimeout(() => refetchAudit(), 1000);
      
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
        description: "You don't have permission to unlock variations or there are unsaved changes",
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
        approval_comments: unlockComment + previousComment
      };

      await onUpdate(variation.id, updateData);
      
      // Log the unlock - but don't block on it
      try {
        await logAuditEntry('unlock', {
          statusFrom: variation.status,
          statusTo: unlockTargetStatus,
          comments: unlockComment
        });
      } catch (auditError) {
        console.warn('Failed to log audit entry, but continuing:', auditError);
      }
      
      // Refresh audit trail
      setTimeout(() => refetchAudit(), 1000);
      
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

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'submit':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'unlock':
        return <Unlock className="h-4 w-4 text-orange-600" />;
      case 'email_sent':
        return <Send className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatActionType = (actionType: string) => {
    switch (actionType) {
      case 'create': return 'Created';
      case 'submit': return 'Submitted for Approval';
      case 'approve': return 'Approved';
      case 'reject': return 'Rejected';
      case 'unlock': return 'Unlocked';
      case 'email_sent': return 'Email Sent';
      default: return actionType;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-6 pr-4">
        {/* Blocked Notice */}
        {isBlocked && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-800">Approval Actions Blocked</h4>
                  <p className="text-sm text-yellow-700">
                    Please save or cancel your changes before using the approval workflow.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Status</span>
              {getWorkflowStatusBadge(variation.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {variation.status !== 'draft' && (
              <div className="space-y-3">
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
                    <ScrollArea className="h-32">
                      <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                        {variation.approval_comments}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Approval History
              {approvalHistory.length > 0 && (
                <Badge variant="outline">{approvalHistory.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading approval history...</span>
              </div>
            ) : approvalHistory.length > 0 ? (
              <ScrollArea className="h-80">
                <div className="space-y-4 pr-4">
                  {approvalHistory.map((entry, index) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="mt-0.5">
                        {getActionIcon(entry.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{formatActionType(entry.action_type)}</span>
                          {entry.status_to && getWorkflowStatusBadge(entry.status_to)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          by {entry.user_name} on {new Date(entry.action_timestamp).toLocaleString()}
                        </div>
                        
                        {/* Status changes */}
                        {entry.status_from && entry.status_to && (
                          <div className="text-sm mb-2">
                            <span className="font-medium">Status change:</span> 
                            <span className="ml-1">{entry.status_from} → {entry.status_to}</span>
                          </div>
                        )}
                        
                        {/* Comments */}
                        {entry.comments && (
                          <div className="text-sm text-gray-700 bg-white p-2 rounded border">
                            {entry.comments}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No approval history available</p>
                <p className="text-sm">Actions will appear here as the variation progresses through approval</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit for Approval - Enhanced with better feedback */}
        {canSubmitForApproval && !isBlocked && (
          <Card>
            <CardHeader>
              <CardTitle>Submit for Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
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
            </CardContent>
          </Card>
        )}

        {/* Approval Actions */}
        {showApprovalActions && !isBlocked && (
          <Card>
            <CardHeader>
              <CardTitle>Approval Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Approval Comments */}
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

                {/* Rejection Reason */}
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

              {/* Action Buttons */}
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
            </CardContent>
          </Card>
        )}

        {/* Unlock Section - Now shows for both approved AND rejected */}
        {showUnlockActions && !isBlocked && (
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Unlock className="h-5 w-5" />
                Unlock {variation.status === 'approved' ? 'Approved' : 'Rejected'} Variation 
                {isProjectManager && " (Project Manager Override)"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Warning:</strong> This will unlock the {variation.status} variation and revert it to draft status. 
                  The variation can then be edited and resubmitted. This action creates an audit trail.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </CardContent>
          </Card>
        )}

        {/* Permission Info */}
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2 text-blue-900">Your Permissions</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• Role: {userRole}</div>
              {canSubmitForApproval && <div>• Can submit variations for approval</div>}
              {canApprove && <div>• Can approve/reject variations</div>}
              {canUnlock && <div>• Can unlock and revert approved/rejected variations</div>}
              {isProjectManager && <div>• Project Manager override permissions enabled</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default EnhancedVariationApprovalTab;
