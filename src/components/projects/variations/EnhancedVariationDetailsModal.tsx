
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  MapPin, Calendar, DollarSign, Clock, User, Mail, FileText, Edit, 
  Check, X, Download, Paperclip, Save, AlertTriangle, CheckCircle, XCircle
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isApproving, setIsApproving] = useState(false);

  // Get attachments for this variation
  const { 
    attachments, 
    loading: attachmentsLoading, 
    fetchAttachments, 
    downloadAttachment,
    deleteAttachment 
  } = variation ? useVariationAttachments(variation.id) : {
    attachments: [],
    loading: false,
    fetchAttachments: async () => {},
    downloadAttachment: async () => {},
    deleteAttachment: async () => {}
  };

  useEffect(() => {
    if (variation && fetchAttachments) {
      fetchAttachments();
    }
  }, [variation, fetchAttachments]);

  if (!variation) return null;

  // Permission checks - developers and admins can edit/approve
  const canEditVariation = isDeveloper() || canEdit('variations') || canAdmin('variations');
  const canApproveVariation = isDeveloper() || canAdmin('variations') || user?.role === 'project_manager';

  const handleEdit = () => {
    setEditData({
      title: variation.title,
      description: variation.description || '',
      location: variation.location || '',
      category: variation.category || '',
      trade: variation.trade || '',
      priority: variation.priority,
      client_email: variation.client_email || '',
      justification: variation.justification || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    
    try {
      await onUpdate(variation.id, editData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Variation updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (newStatus: string, comments?: string) => {
    if (!onUpdate) return;
    
    setIsApproving(true);
    try {
      const updates: any = {
        status: newStatus,
        approval_comments: comments || ''
      };

      if (newStatus === 'approved' || newStatus === 'rejected') {
        updates.approved_by = user?.id;
        updates.approval_date = new Date().toISOString().split('T')[0];
      }

      await onUpdate(variation.id, updates);
      toast({
        title: "Success",
        description: `Variation ${newStatus} successfully`
      });
    } catch (error) {
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
      toast({
        title: "Error",
        description: "Failed to download attachment",
        variant: "destructive"
      });
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteAttachment(attachmentId);
        toast({
          title: "Success",
          description: "Attachment deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete attachment",
          variant: "destructive"
        });
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
            <div className="flex gap-2">
              {canEditVariation && !isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
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
                  {isEditing ? (
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="text-lg font-semibold"
                    />
                  ) : (
                    <span>{variation.title}</span>
                  )}
                  <div className="flex items-center gap-2">
                    {getStatusBadge(variation.status)}
                    {isEditing ? (
                      <Select 
                        value={editData.priority} 
                        onValueChange={(value) => setEditData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getPriorityBadge(variation.priority)
                    )}
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
                      {isEditing ? (
                        <Input
                          value={editData.location}
                          onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                          className="flex-1"
                        />
                      ) : (
                        <span>{variation.location || 'Not specified'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Category:</span>
                      {isEditing ? (
                        <Input
                          value={editData.category}
                          onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                          className="flex-1"
                        />
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {variation.category || 'Not specified'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium">Trade:</span>
                      {isEditing ? (
                        <Input
                          value={editData.trade}
                          onChange={(e) => setEditData(prev => ({ ...prev, trade: e.target.value }))}
                          className="flex-1"
                        />
                      ) : (
                        <Badge variant="outline" className="capitalize">
                          {variation.trade || 'Not specified'}
                        </Badge>
                      )}
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
                      {isEditing ? (
                        <Input
                          type="email"
                          value={editData.client_email}
                          onChange={(e) => setEditData(prev => ({ ...prev, client_email: e.target.value }))}
                          className="flex-1"
                        />
                      ) : (
                        <span className="text-sm">{variation.client_email || 'Not provided'}</span>
                      )}
                    </div>

                    {variation.email_sent && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Email sent on {variation.email_sent_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description & Justification */}
            <Card>
              <CardHeader>
                <CardTitle>Description & Justification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-medium">Description</Label>
                  {isEditing ? (
                    <Textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md mt-1">
                      {variation.description || 'No description provided'}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="font-medium">Justification</Label>
                  {isEditing ? (
                    <Textarea
                      value={editData.justification}
                      onChange={(e) => setEditData(prev => ({ ...prev, justification: e.target.value }))}
                      rows={2}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md mt-1">
                      {variation.justification || 'No justification provided'}
                    </p>
                  )}
                </div>
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
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">${item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator className="my-4" />
                  
                  <div className="grid grid-cols-3 gap-4 text-right">
                    <div>
                      <Label>Subtotal</Label>
                      <div className="text-lg font-semibold">${subtotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label>GST</Label>
                      <div className="text-lg font-semibold">${gstAmount.toFixed(2)}</div>
                    </div>
                    <div>
                      <Label>Total Amount</Label>
                      <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
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
                        <span>Extension of Time (EOT): {variation.eot_days} days</span>
                      </div>
                    )}
                    {variation.requires_nod && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span>Notice of Delay (NOD): {variation.nod_days} days</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>File Attachments ({attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {attachmentsLoading ? (
                  <div className="text-center py-4">Loading attachments...</div>
                ) : attachments.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No attachments</div>
                ) : (
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
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Actions */}
            {isEditing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Approval Workflow - Right Side (1 column) */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">Current Status</div>
                  <div className="mt-2">{getStatusBadge(variation.status)}</div>
                </div>

                {canApproveVariation && variation.status === 'pending_approval' && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      onClick={() => handleStatusChange('approved')}
                      disabled={isApproving}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={() => handleStatusChange('rejected')}
                      disabled={isApproving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {canApproveVariation && variation.status === 'draft' && (
                  <Button 
                    className="w-full" 
                    onClick={() => handleStatusChange('pending_approval')}
                    disabled={isApproving}
                  >
                    Submit for Approval
                  </Button>
                )}

                {canApproveVariation && (variation.status === 'approved' || variation.status === 'rejected') && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleStatusChange('pending_approval')}
                    disabled={isApproving}
                  >
                    Revert to Pending
                  </Button>
                )}

                {variation.approval_date && (
                  <div className="text-sm">
                    <div className="font-medium">Approved/Rejected:</div>
                    <div>{variation.approval_date}</div>
                    {variation.approved_by && (
                      <div className="text-gray-600">By: {variation.approved_by}</div>
                    )}
                  </div>
                )}

                {variation.approval_comments && (
                  <div className="text-sm">
                    <div className="font-medium">Comments:</div>
                    <div className="bg-gray-50 p-2 rounded text-gray-700">
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
