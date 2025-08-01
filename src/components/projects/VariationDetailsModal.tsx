
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar, DollarSign, Clock, User, Mail, FileText, Edit, Check, X, Download, Paperclip } from 'lucide-react';
import { useSimplePermissions } from '@/hooks/useSimplePermissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import PermissionGate from '@/components/PermissionGate';
import VariationApprovalWorkflow from './VariationApprovalWorkflow';

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
  priority: string;
  client_email?: string;
  justification?: string;
  approved_by?: string;
  approval_date?: string;
  approval_comments?: string;
  email_sent?: boolean;
  email_sent_date?: string;
  attachments?: any[];
}

interface VariationDetailsModalProps {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
}

const VariationDetailsModal: React.FC<VariationDetailsModalProps> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate
}) => {
  // All hooks must be called at the top
  const { toast } = useToast();
  const { canEdit } = useSimplePermissions();
  const { user } = useAuth();
  const isDeveloper = () => user?.email === 'huy.nguyen@dcsquared.com.au';
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Early return after all hooks are called
  if (!variation) return null;

  // Enhanced permission checks using the permission system
  const canEditVariation = isDeveloper() || canEdit();

  console.log('VariationDetailsModal permissions:', {
    isDeveloper: isDeveloper(),
    canEdit: canEdit(),
    canEditVariation,
    variationStatus: variation.status
  });

  const handleEdit = () => {
    if (!canEditVariation) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit variations",
        variant: "destructive"
      });
      return;
    }

    setEditData({
      title: variation.title,
      description: variation.description || '',
      location: variation.location || '',
      cost_impact: variation.cost_impact,
      time_impact: variation.time_impact,
      category: variation.category || '',
      priority: variation.priority,
      client_email: variation.client_email || '',
      justification: variation.justification || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate || !canEditVariation) return;
    
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

  const handleAttachmentView = (attachment: any) => {
    // In a real implementation, this would open/download the attachment
    console.log('Viewing attachment:', attachment);
    toast({
      title: "Attachment",
      description: `Opening ${attachment.name}`,
    });
  };

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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {variation.variation_number}
              </DialogTitle>
              <DialogDescription>
                Detailed information and approval workflow for this variation
              </DialogDescription>
            </div>
            <div className="flex gap-2">
            <PermissionGate>
              {!isEditing && variation.status === 'draft' && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </PermissionGate>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                ) : (
                  <h3 className="text-lg font-semibold">{variation.title}</h3>
                )}
                <div className="flex items-center gap-2 mt-2">
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
              </div>
              <div className="text-right">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="edit-cost">Cost Impact ($)</Label>
                    <Input
                      id="edit-cost"
                      type="number"
                      value={editData.cost_impact}
                      onChange={(e) => setEditData(prev => ({ ...prev, cost_impact: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(variation.cost_impact)}
                    </div>
                    <div className="text-sm text-gray-600">Cost Impact</div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Submitted:</span>
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
                    <span>{variation.location}</span>
                  )}
                </div>

                {variation.requested_by && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Submitted by:</span>
                    <span>{variation.requested_by}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Time Impact:</span>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.time_impact}
                      onChange={(e) => setEditData(prev => ({ ...prev, time_impact: parseInt(e.target.value) || 0 }))}
                      className="w-20"
                    />
                  ) : (
                    <span>
                      {variation.time_impact > 0 ? `+${variation.time_impact}d` : 
                       variation.time_impact === 0 ? '0d' : `${variation.time_impact}d`}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Category:</span>
                  {isEditing ? (
                    <Select 
                      value={editData.category} 
                      onValueChange={(value) => setEditData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="structural">Structural</SelectItem>
                        <SelectItem value="fixtures">Fixtures & Fittings</SelectItem>
                        <SelectItem value="finishes">Finishes</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="capitalize">
                      {variation.category}
                    </Badge>
                  )}
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
                    <span className="text-sm">{variation.client_email}</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              {isEditing ? (
                <Textarea
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {variation.description}
                </p>
              )}
            </div>

            {/* Justification */}
            <div>
              <h4 className="font-medium mb-2">Justification</h4>
              {isEditing ? (
                <Textarea
                  value={editData.justification}
                  onChange={(e) => setEditData(prev => ({ ...prev, justification: e.target.value }))}
                  rows={2}
                />
              ) : (
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {variation.justification}
                </p>
              )}
            </div>

            {/* Attachments */}
            {variation.attachments && variation.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  <div className="space-y-2">
                    {variation.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{attachment.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAttachmentView(attachment)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Edit Actions */}
            <PermissionGate>
              {isEditing && (
                <>
                  <Separator />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </>
              )}
            </PermissionGate>
          </div>

          {/* Approval Workflow - Right Side */}
          <div className="lg:col-span-1">
            <VariationApprovalWorkflow 
              variation={variation}
              onUpdate={onUpdate || (() => Promise.resolve())}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariationDetailsModal;
