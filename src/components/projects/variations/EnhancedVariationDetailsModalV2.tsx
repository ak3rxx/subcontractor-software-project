
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Edit, Check, X, Loader2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useVariationAuditTrail } from '@/hooks/useVariationAuditTrail';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import PermissionGate from '@/components/PermissionGate';
import VariationDetailsTab from './VariationDetailsTab';
import VariationCostTab from './VariationCostTab';
import VariationFilesTab from './VariationFilesTab';
import EnhancedVariationApprovalTab from './EnhancedVariationApprovalTab';

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
  trade?: string;
  requires_nod?: boolean;
  requires_eot?: boolean;
  nod_days?: number;
  eot_days?: number;
  total_amount?: number;
  gst_amount?: number;
  cost_breakdown?: any[];
  updated_at?: string;
}

interface EnhancedVariationDetailsModalV2Props {
  variation: Variation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: Variation) => void;
}

const EnhancedVariationDetailsModalV2: React.FC<EnhancedVariationDetailsModalV2Props> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate,
  onVariationUpdate
}) => {
  // All hooks must be called at the top level - never conditionally
  const { toast } = useToast();
  const { isDeveloper, canEdit } = usePermissions();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(variation);
  const [activeTab, setActiveTab] = useState('details');

  // Initialize hooks with stable IDs - these must always be called
  const variationId = currentVariation?.id || variation?.id;
  const { logAuditEntry } = useVariationAuditTrail(variationId);
  
  // Initialize attachments hook
  const {
    attachments,
    loading: attachmentsLoading,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment,
    fetchAttachments
  } = useVariationAttachments(variationId);

  // Update current variation when prop changes
  useEffect(() => {
    if (variation) {
      console.log('Updating current variation:', variation.id, variation.status);
      setCurrentVariation(variation);
    }
  }, [variation]);

  // Handle case where no variation exists - AFTER all hooks are called
  if (!currentVariation && !variation) {
    return null;
  }

  // Use the most current variation data
  const workingVariation = currentVariation || variation;
  if (!workingVariation) {
    return null;
  }

  const canEditVariation = isDeveloper() || canEdit('variations');

  console.log('EnhancedVariationDetailsModalV2 permissions:', {
    isDeveloper: isDeveloper(),
    canEdit: canEdit('variations'),
    canEditVariation,
    variationStatus: workingVariation.status,
    variationId: workingVariation.id
  });

  const initializeEditData = useCallback(() => {
    if (!workingVariation) return;
    
    setEditData({
      title: workingVariation.title,
      description: workingVariation.description || '',
      location: workingVariation.location || '',
      cost_impact: workingVariation.cost_impact,
      time_impact: workingVariation.time_impact,
      category: workingVariation.category || '',
      priority: workingVariation.priority,
      client_email: workingVariation.client_email || '',
      justification: workingVariation.justification || '',
      trade: workingVariation.trade || '',
      requires_nod: workingVariation.requires_nod || false,
      requires_eot: workingVariation.requires_eot || false,
      nod_days: workingVariation.nod_days || 0,
      eot_days: workingVariation.eot_days || 0,
      total_amount: workingVariation.total_amount || 0,
      gst_amount: workingVariation.gst_amount || 0,
      cost_breakdown: workingVariation.cost_breakdown || []
    });
  }, [workingVariation]);

  const handleEdit = () => {
    if (!canEditVariation) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit variations",
        variant: "destructive"
      });
      return;
    }

    initializeEditData();
    setIsEditing(true);
    setHasUnsavedChanges(false);
  };

  const handleDataChange = (changes: any) => {
    setEditData(prev => {
      const newData = { ...prev, ...changes };
      
      // Check if there are actual changes
      const hasChanges = Object.keys(changes).some(key => {
        const currentValue = workingVariation[key as keyof Variation];
        const newValue = newData[key];
        return currentValue !== newValue;
      });
      
      if (hasChanges && !hasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
      
      return newData;
    });
  };

  const handleSave = async () => {
    if (!onUpdate || !canEditVariation || !workingVariation) return;
    
    setIsSaving(true);
    try {
      // Prepare update data with updated_at timestamp
      const updateData = {
        ...editData,
        updated_at: new Date().toISOString()
      };

      console.log('Saving variation updates:', updateData);
      await onUpdate(workingVariation.id, updateData);
      
      // Log detailed audit entries for each changed field
      const changedFields = Object.keys(editData).filter(key => {
        const oldValue = workingVariation[key as keyof Variation];
        const newValue = editData[key];
        return oldValue !== newValue;
      });

      console.log('Changed fields:', changedFields);
      for (const field of changedFields) {
        const oldValue = String(workingVariation[field as keyof Variation] || '');
        const newValue = String(editData[field] || '');
        
        if (oldValue !== newValue) {
          await logAuditEntry('edit', {
            fieldName: field,
            oldValue,
            newValue,
            comments: `Field '${field}' updated from '${oldValue}' to '${newValue}'`
          });
        }
      }

      // Update the current variation state with new data
      const updatedVariation = { ...workingVariation, ...updateData };
      setCurrentVariation(updatedVariation);
      
      // Notify parent component of the update immediately
      if (onVariationUpdate) {
        console.log('Notifying parent of variation update');
        onVariationUpdate(updatedVariation);
      }
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      toast({
        title: "Success",
        description: "Variation updated successfully"
      });
    } catch (error) {
      console.error('Error saving variation:', error);
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm("You have unsaved changes. Are you sure you want to cancel?");
      if (!confirmCancel) return;
    }
    
    setIsEditing(false);
    setHasUnsavedChanges(false);
    initializeEditData();
  };

  // Handle status changes from approval tab with immediate refresh
  const handleStatusChange = useCallback(async () => {
    console.log('Status change callback triggered - forcing immediate refresh');
    
    // Force immediate refresh of attachments if variation ID exists
    if (workingVariation?.id) {
      console.log('Refreshing attachments for variation:', workingVariation.id);
      await fetchAttachments();
    }
    
    // Notify parent component to refresh the variation data immediately
    if (onVariationUpdate && workingVariation) {
      console.log('Triggering parent refresh for variation:', workingVariation.id);
      // Create a refreshed variation with current timestamp to force update
      const refreshedVariation = {
        ...workingVariation,
        updated_at: new Date().toISOString()
      };
      onVariationUpdate(refreshedVariation);
      setCurrentVariation(refreshedVariation);
    }
  }, [onVariationUpdate, workingVariation, fetchAttachments]);

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

  const canEditInCurrentStatus = () => {
    return workingVariation.status === 'draft' || isDeveloper();
  };

  const shouldShowEditConfirmation = () => {
    return workingVariation.status !== 'draft' && !isDeveloper();
  };

  const handleEditWithConfirmation = () => {
    if (shouldShowEditConfirmation()) {
      const confirmEdit = window.confirm(
        `This variation is currently ${workingVariation.status}. Editing will require administrative review. Are you sure you want to proceed?`
      );
      if (!confirmEdit) return;
    }
    handleEdit();
  };

  // File management handlers
  const handleFileUpload = async (files: File[]) => {
    try {
      // Upload files one by one since uploadAttachment handles single files
      for (const file of files) {
        await uploadAttachment(file);
      }
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const handleFileDownload = async (attachment: any) => {
    try {
      await downloadAttachment(attachment);
    } catch (error) {
      console.error('File download error:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleFileDelete = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      toast({
        title: "Success",
        description: "File deleted successfully"
      });
    } catch (error) {
      console.error('File delete error:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {workingVariation.variation_number}
              </DialogTitle>
              <DialogDescription>
                {workingVariation.title}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(workingVariation.status)}
              <PermissionGate module="variations" requiredLevel="write">
                {!isEditing && canEditVariation && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditWithConfirmation}
                    disabled={isSaving}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </PermissionGate>
            </div>
          </div>
        </DialogHeader>

        {/* Edit Actions Bar */}
        {isEditing && (
          <div className="flex items-center justify-between p-4 bg-blue-50 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Edit Mode {hasUnsavedChanges && "(Unsaved changes)"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="approval">Approval</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="details" className="h-full overflow-y-auto">
                <VariationDetailsTab
                  variation={workingVariation}
                  editData={editData}
                  isEditing={isEditing}
                  onDataChange={handleDataChange}
                />
              </TabsContent>
              
              <TabsContent value="costs" className="h-full overflow-y-auto">
                <VariationCostTab
                  variation={workingVariation}
                  editData={editData}
                  isEditing={isEditing}
                  onDataChange={handleDataChange}
                />
              </TabsContent>
              
              <TabsContent value="files" className="h-full overflow-y-auto">
                <VariationFilesTab
                  variation={workingVariation}
                  attachments={attachments || []}
                  attachmentsLoading={attachmentsLoading}
                  canEdit={canEditVariation && !isEditing}
                  onUpload={handleFileUpload}
                  onDownload={handleFileDownload}
                  onDelete={handleFileDelete}
                />
              </TabsContent>
              
              <TabsContent value="approval" className="h-full overflow-y-auto">
                <EnhancedVariationApprovalTab 
                  variation={workingVariation}
                  onUpdate={onUpdate || (() => Promise.resolve())}
                  onStatusChange={handleStatusChange}
                  isBlocked={isEditing && hasUnsavedChanges}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedVariationDetailsModalV2;
