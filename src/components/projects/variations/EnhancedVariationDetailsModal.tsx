import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Eye, Edit, Send, 
  DollarSign, Clock, MapPin, User, Calendar,
  Paperclip, AlertTriangle, CheckCircle, XCircle,
  Mail, Phone, Building, Tag, Flag
} from 'lucide-react';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import { useToast } from '@/hooks/use-toast';

interface EnhancedVariationDetailsModalProps {
  variation: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onEdit?: (variation: any) => void;
  projectName: string;
}

const EnhancedVariationDetailsModal: React.FC<EnhancedVariationDetailsModalProps> = ({
  variation,
  isOpen,
  onClose,
  onUpdate,
  onEdit,
  projectName
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get attachments for this variation
  const { 
    attachments, 
    loading: attachmentsLoading, 
    fetchAttachments, 
    downloadAttachment 
  } = useVariationAttachments(variation?.id || '');

  // Fetch attachments when variation changes
  useEffect(() => {
    if (variation?.id && isOpen) {
      fetchAttachments();
    }
  }, [variation?.id, isOpen, fetchAttachments]);

  if (!variation) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">✅ Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">❌ Rejected</Badge>;
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending Approval</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">📝 Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Flag className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Tag className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await onUpdate(variation.id, { 
        status: newStatus,
        approval_date: newStatus === 'approved' ? new Date().toISOString().split('T')[0] : null
      });
      toast({
        title: "Success",
        description: `Variation status updated to ${newStatus}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variation status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadAttachment = async (attachment: any) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Variation {variation.variation_number} - {variation.title}
            </DialogTitle>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(variation)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="costing">Costing</TabsTrigger>
            <TabsTrigger value="attachments">
              Attachments ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Variation Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Project</p>
                    <p className="text-lg font-semibold">{projectName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    {getStatusBadge(variation.status)}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p>{variation.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Requested By
                    </p>
                    <p>{variation.requested_by || 'Unknown'}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Request Date
                    </p>
                    <p>{variation.request_date || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      {getPriorityIcon(variation.priority)}
                      Priority
                    </p>
                    <p>{variation.priority || 'Medium'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-600">Description</p>
                  <p>{variation.description || 'No description provided'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variation.cost_breakdown && variation.cost_breakdown.length > 0 ? (
                      variation.cost_breakdown.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${item.rate.toFixed(2)}</TableCell>
                          <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">No cost breakdown items</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Subtotal:</span>
                    <span>${(variation.total_amount - variation.gst_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">GST:</span>
                    <span>${variation.gst_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${variation.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  File Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attachmentsLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading attachments...</p>
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Paperclip className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attachments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{attachment.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB • 
                              Uploaded {new Date(attachment.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadAttachment(attachment)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Variation History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="mt-4 flex justify-end gap-2">
          {variation.status !== 'approved' && (
            <Button
              variant="ghost"
              onClick={() => handleStatusUpdate('approved')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          )}
          {variation.status !== 'rejected' && (
            <Button
              variant="ghost"
              onClick={() => handleStatusUpdate('rejected')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVariationDetailsModal;
