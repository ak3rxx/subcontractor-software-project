
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, Calendar, DollarSign, Clock, User, Mail, FileText, 
  Download, Paperclip, AlertTriangle, CheckCircle, XCircle, Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';

interface CostBreakdownItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  subtotal: number;
}

interface Variation {
  id: string;
  variation_number: string;
  title: string;
  description?: string;
  location?: string;
  requested_by?: string;
  request_date: string;
  cost_impact: number;
  time_impact: number;
  status: string;
  category?: string;
  trade?: string;
  priority: string;
  client_email?: string;
  justification?: string;
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
  email_sent?: boolean;
  email_sent_date?: string;
  cost_breakdown?: CostBreakdownItem[];
  gst_amount?: number;
  total_amount?: number;
  requires_eot?: boolean;
  requires_nod?: boolean;
  eot_days?: number;
  nod_days?: number;
  time_impact_details?: {
    requiresNoticeOfDelay?: boolean;
    requiresExtensionOfTime?: boolean;
    noticeOfDelayDays?: number;
    extensionOfTimeDays?: number;
  };
}

interface EnhancedVariationDetailsModalProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
}

const EnhancedVariationDetailsModal: React.FC<EnhancedVariationDetailsModalProps> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDeveloper, canEdit, canAdmin } = usePermissions();
  const [isApproving, setIsApproving] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');

  // Always call the hooks, but handle null variation
  const { 
    attachments, 
    loading: attachmentsLoading, 
    fetchAttachments, 
    downloadAttachment,
    deleteAttachment 
  } = useVariationAttachments(variation?.id);

  useEffect(() => {
    if (variation?.id && fetchAttachments) {
      console.log('Fetching attachments for variation:', variation.id);
      fetchAttachments();
    }
  }, [variation?.id, fetchAttachments]);

  if (!variation) return null;

  // Permission checks - developers and admins can edit/approve
  const canEditVariation = isDeveloper() || canEdit('variations') || canAdmin('variations');
  const canApproveVariation = isDeveloper() || canAdmin('variations');

  console.log('Modal permission checks:', {
    isDeveloper: isDeveloper(),
    canEdit: canEdit('variations'),
    canAdmin: canAdmin('variations'),
    canEditVariation,
    canApproveVariation
  });

  const handleStatusChange = async (newStatus: string, comments?: string) => {
    if (!onUpdate) return;
    
    setIsApproving(true);
    try {
      const updates: any = {
        status: newStatus,
        approval_comments: comments || approvalComments
      };

      if (newStatus === 'approved' || newStatus === 'rejected') {
        updates.approved_by = user?.id;
        updates.approval_date = new Date().toISOString().split('T')[0];
      }

      console.log('Updating variation status:', updates);
      await onUpdate(variation.id, updates);
      
      toast({
        title: "Success",
        description: `Variation ${newStatus} successfully`
      });
      
      setApprovalComments('');
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: `Failed to ${newStatus} variation`,
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleAttachmentDownload = async (attachment: any) => {
    try {
      await downloadAttachment(attachment);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive"
      });
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (!canEditVariation) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete attachments",
        variant: "destructive"
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteAttachment(attachmentId);
      } catch (error) {
        console.error('Error deleting attachment:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">Medium</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const costBreakdown = variation.cost_breakdown || [];
  const subtotal = costBreakdown.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const gstAmount = variation.gst_amount || 0;
  const totalAmount = variation.total_amount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {variation.variation_number}
              </DialogTitle>
              <DialogDescription>
                Complete details and approval workflow for this variation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - Left Side (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{variation.title}</span>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(variation.status)}
                    {getPriorityBadge(variation.priority)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Request Date:</span>
                      <span>{variation.request_date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Location:</span>
                      <span>{variation.location || 'Not specified'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Category:</span>
                      <Badge variant="outline" className="capitalize">
                        {variation.category || 'Not specified'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Trade:</span>
                      <Badge variant="outline" className="capitalize">
                        {variation.trade || 'Not specified'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Cost Impact:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(variation.cost_impact)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Time Impact:</span>
                      <span>
                        {variation.time_impact > 0 ? `+${variation.time_impact}d` : 
                         variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Client Email:</span>
                      <span className="text-sm">{variation.client_email || 'Not provided'}</span>
                    </div>

                    {variation.email_sent && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Email Sent:</span>
                        <Badge variant="outline" className="text-green-600">
                          {variation.email_sent_date || 'Yes'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {variation.description || 'No description provided'}
                </p>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            {costBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costBreakdown.map((item, index) => (
                        <TableRow key={item.id || index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST:</span>
                      <span>${gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Time Impact Details */}
            {(variation.requires_eot || variation.requires_nod) && (
              <Card>
                <CardHeader>
                  <CardTitle>Time Impact Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {variation.requires_eot && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Extension of Time Required: {variation.eot_days} days</span>
                      </div>
                    )}
                    {variation.requires_nod && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Notice of Delay Required: {variation.nod_days} days</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Justification */}
            {variation.justification && (
              <Card>
                <CardHeader>
                  <CardTitle>Justification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {variation.justification}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments ({attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {attachmentsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{attachment.file_name}</span>
                          <span className="text-xs text-gray-500">
                            ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAttachmentDownload(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canEditVariation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAttachmentDelete(attachment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No attachments</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Approval Workflow - Right Side */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Current Status</div>
                  {getStatusBadge(variation.status)}
                </div>

                {variation.status === 'pending_approval' && canApproveVariation && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add approval comments..."
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      rows={3}
                    />
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleStatusChange('approved')}
                        disabled={isApproving}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        onClick={() => handleStatusChange('rejected')}
                        disabled={isApproving}
                        variant="destructive"
                        className="w-full"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {variation.status === 'draft' && canApproveVariation && (
                  <Button
                    onClick={() => handleStatusChange('pending_approval')}
                    disabled={isApproving}
                    className="w-full"
                  >
                    Submit for Approval
                  </Button>
                )}

                {(variation.status === 'approved' || variation.status === 'rejected') && canApproveVariation && (
                  <Button
                    onClick={() => handleStatusChange('pending_approval')}
                    disabled={isApproving}
                    variant="outline"
                    className="w-full"
                  >
                    Revert to Pending
                  </Button>
                )}

                {variation.approved_by && (
                  <div className="text-sm text-gray-600">
                    <div>Approved by: {variation.approved_by}</div>
                    {variation.approval_date && (
                      <div>Date: {variation.approval_date}</div>
                    )}
                  </div>
                )}

                {variation.approval_comments && (
                  <div className="text-sm">
                    <div className="font-medium mb-1">Comments:</div>
                    <div className="text-gray-600 bg-gray-50 p-2 rounded">
                      {variation.approval_comments}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVariationDetailsModal;
