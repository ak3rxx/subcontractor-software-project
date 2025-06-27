
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Save, X, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Variation } from '@/hooks/useVariations';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import VariationDetailsTab from './VariationDetailsTab';
import VariationCostTab from './VariationCostTab';
import VariationFilesTab from './VariationFilesTab';
import EnhancedVariationApprovalTab from './EnhancedVariationApprovalTab';

interface EnhancedVariationDetailsModalV2Props {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
}

const EnhancedVariationDetailsModalV2: React.FC<EnhancedVariationDetailsModalV2Props> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDeveloper, canEdit } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');

  const {
    attachments,
    loading: attachmentsLoading,
    fetchAttachments,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment
  } = useVariationAttachments(variation?.id);

  // Fetch attachments when variation changes
  useEffect(() => {
    if (variation?.id && isOpen) {
      fetchAttachments();
    }
  }, [variation?.id, isOpen, fetchAttachments]);

  // Reset edit state when variation changes
  useEffect(() => {
    if (variation && isOpen) {
      setEditData({
        title: variation.title,
        description: variation.description || '',
        location: variation.location || '',
        category: variation.category || '',
        priority: variation.priority,
        client_email: variation.client_email || '',
        justification: variation.justification || '',
        time_impact: variation.time_impact,
        cost_breakdown: variation.cost_breakdown || [],
        total_amount: variation.total_amount || variation.cost_impact,
        gst_amount: variation.gst_amount || 0
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setActiveTab('details');
    }
  }, [variation, isOpen]);

  if (!variation) return null;

  // Enhanced permission checks
  const userRole = user?.role || 'user';
  const userEmail = user?.email || '';
  const isFullAccessUser = userEmail === 'huy.nguyen@dcsquared.com.au';
  const canEditVariation = [
    'project_manager', 
    'contract_administrator', 
    'project_engineer',
    'admin',
    'manager'
  ].includes(userRole) || isFullAccessUser || isDeveloper() || canEdit('variations');

  const handleEdit = () => {
    if (!canEditVariation) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit variations",
        variant: "destructive"
      });
      return;
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!onUpdate || !canEditVariation) return;
    
    try {
      await onUpdate(variation.id, editData);
      setIsEditing(false);
      setHasUnsavedChanges(false);
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

  const handleCancel = () => {
    setEditData({
      title: variation.title,
      description: variation.description || '',
      location: variation.location || '',
      category: variation.category || '',
      priority: variation.priority,
      client_email: variation.client_email || '',
      justification: variation.justification || '',
      time_impact: variation.time_impact,
      cost_breakdown: variation.cost_breakdown || [],
      total_amount: variation.total_amount || variation.cost_impact,
      gst_amount: variation.gst_amount || 0
    });
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleDataChange = (newData: any) => {
    setEditData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
  };

  // Handle file uploads by processing array of files
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      await uploadAttachment(file);
    }
    // Refresh attachments after upload
    await fetchAttachments();
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
        return <Badge className="bg-gray-100 text-gray-800">📝 Draft</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const canShowApprovalTab = () => {
    // Show approval tab if variation is not in draft or if user can edit
    return variation.status !== 'draft' || canEditVariation;
  };

  // Disable approval actions when in edit mode with unsaved changes
  const isApprovalBlocked = isEditing && hasUnsavedChanges;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {variation.variation_number}
                {getStatusBadge(variation.status)}
              </DialogTitle>
              <DialogDescription>
                {variation.title}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {canEditVariation && !isEditing && variation.status === 'draft' && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {isApprovalBlocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800">
                  Please save or cancel your changes before using the approval workflow.
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            {canShowApprovalTab() && (
              <TabsTrigger value="approval" disabled={isApprovalBlocked}>
                Approval
                {isApprovalBlocked && (
                  <AlertTriangle className="h-3 w-3 ml-1 text-yellow-600" />
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="details" className="mt-0">
              <VariationDetailsTab
                variation={variation}
                editData={editData}
                isEditing={isEditing}
                onDataChange={handleDataChange}
              />
            </TabsContent>

            <TabsContent value="costs" className="mt-0">
              <VariationCostTab
                variation={variation}
                editData={editData}
                isEditing={isEditing}
                onDataChange={handleDataChange}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-0">
              <VariationFilesTab
                variation={variation}
                attachments={attachments}
                attachmentsLoading={attachmentsLoading}
                canEdit={canEditVariation && isEditing}
                onUpload={handleFileUpload}
                onDownload={downloadAttachment}
                onDelete={deleteAttachment}
              />
            </TabsContent>

            {canShowApprovalTab() && (
              <TabsContent value="approval" className="mt-0">
                <EnhancedVariationApprovalTab
                  variation={variation}
                  onUpdate={onUpdate || (() => Promise.resolve())}
                  isBlocked={isApprovalBlocked}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVariationDetailsModalV2;
