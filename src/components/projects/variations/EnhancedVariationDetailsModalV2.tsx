
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Edit, Check, X, Loader2, AlertCircle } from 'lucide-react';
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
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const { toast } = useToast();
  const { isDeveloper, canEdit } = usePermissions();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [currentVariation, setCurrentVariation] = useState<Variation | null>(variation);
  const [activeTab, setActiveTab] = useState('details');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Get stable variation ID for hooks - never conditionally call hooks
  const variationId = variation?.id || currentVariation?.id || '';
  
  // Initialize hooks with stable IDs - these must ALWAYS be called
  const { 
    auditTrail, 
    loading: auditLoading, 
    logAuditEntry,
    logBatchAuditEntries,
    refetch: refetchAudit 
  } = useVariationAuditTrail(variationId);
  
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
    if (variation && isOpen) {
      console.log('Setting current variation:', variation.id, variation.status);
      setCurrentVariation(variation);
      
      // Reset editing state when variation changes
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setEditData({});
      setSaveError(null);
    }
  }, [variation, isOpen]);

  // Initialize edit data when entering edit mode
  const initializeEditData = useCallback(() => {
    if (!currentVariation) return;
    
    const newEditData = {
      title: currentVariation.title || '',
      description: currentVariation.description || '',
      location: currentVariation.location || '',
      cost_impact: currentVariation.cost_impact || 0,
      time_impact: currentVariation.time_impact || 0,
      category: currentVariation.category || '',
      priority: currentVariation.priority || 'medium',
      client_email: currentVariation.client_email || '',
      justification: currentVariation.justification || '',
      trade: currentVariation.trade || '',
      requires_nod: currentVariation.requires_nod || false,
      requires_eot: currentVariation.requires_eot || false,
      nod_days: currentVariation.nod_days || 0,
      eot_days: currentVariation.eot_days || 0,
      total_amount: currentVariation.total_amount || 0,
      gst_amount: currentVariation.gst_amount || 0,
      cost_breakdown: currentVariation.cost_breakdown || []
    };
    
    setEditData(newEditData);
  }, [currentVariation]);

  // Enhanced permissions check
  const canEditVariation = isDeveloper() || canEdit('variations');

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
    setSaveError(null);
  };

  const handleDataChange = (changes: any) => {
    setEditData(prev => {
      const newData = { ...prev, ...changes };
      
      // Check if there are actual changes
      const hasChanges = Object.keys(changes).some(key => {
        const currentValue = currentVariation?.[key as keyof Variation];
        const newValue = newData[key];
        return currentValue !== newValue;
      });
      
      if (hasChanges && !hasUnsavedChanges) {
        setHasUnsavedChanges(true);
      }
      
      setSaveError(null); // Clear any previous save errors
      return newData;
    });
  };

  const handleSave = async () => {
    if (!onUpdate || !canEditVariation || !currentVariation) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const updateData = {
        ...editData,
        updated_at: new Date().toISOString()
      };

      console.log('Saving variation updates:', updateData);
      
      // Update the variation first
      await onUpdate(currentVariation.id, updateData);
      
      // Prepare batch audit entries for changed fields
      const changedFields = Object.keys(editData).filter(key => {
        const oldValue = currentVariation[key as keyof Variation];
        const newValue = editData[key];
        return oldValue !== newValue;
      });

      if (changedFields.length > 0) {
        const auditEntries = changedFields.map(field => ({
          actionType: 'edit' as const,
          options: {
            fieldName: field,
            oldValue: String(currentVariation[field as keyof Variation] || ''),
            newValue: String(editData[field] || ''),
            comments: `Field '${field}' updated via edit mode`
          }
        }));

        console.log('Logging batch audit entries for changed fields:', changedFields);
        await logBatchAuditEntries(auditEntries);
      }

      // Update the current variation state immediately
      const updatedVariation = { ...currentVariation, ...updateData };
      setCurrentVariation(updatedVariation);
      
      // Notify parent component immediately
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
      
      console.log('Variation update completed successfully');
      
    } catch (error) {
      console.error('Error saving variation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update variation';
      setSaveError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
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
    setSaveError(null);
    initializeEditData();
  };

  // Handle status changes with immediate refresh and better error handling
  const handleStatusChange = useCallback(async () => {
    console.log('Status change callback triggered - refreshing audit trail and attachments');
    
    try {
      if (variationId) {
        await Promise.all([
          refetchAudit(),
          fetchAttachments()
        ]);
      }
      
      if (onVariationUpdate && currentVariation) {
        const refreshedVariation = {
          ...currentVariation,
          updated_at: new Date().toISOString()
        };
        onVariationUpdate(refreshedVariation);
        setCurrentVariation(refreshedVariation);
      }
      
      console.log('Status change handling completed successfully');
    } catch (error) {
      console.error('Error in status change handling:', error);
    }
  }, [variationId, refetchAudit, fetchAttachments, onVariationUpdate, currentVariation]);

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
    return currentVariation?.status === 'draft' || isDeveloper();
  };

  const shouldShowEditConfirmation = () => {
    return currentVariation?.status !== 'draft' && !isDeveloper();
  };

  const handleEditWithConfirmation = () => {
    if (shouldShowEditConfirmation()) {
      const confirmEdit = window.confirm(
        `This variation is currently ${currentVariation?.status}. Editing will require administrative review. Are you sure you want to proceed?`
      );
      if (!confirmEdit) return;
    }
    handleEdit();
  };

  // File management handlers
  const handleFileUpload = async (files: File[]) => {
    try {
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

  // CONDITIONAL RENDERING - Only after all hooks are called
  if (!isOpen) {
    return null;
  }

  if (!currentVariation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Variation Selected</DialogTitle>
            <DialogDescription>
              Please select a variation to view details.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {currentVariation.variation_number}
              </DialogTitle>
              <DialogDescription>
                {currentVariation.title}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(currentVariation.status)}
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
              {saveError && (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">{saveError}</span>
                </div>
              )}
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
                  variation={currentVariation}
                  editData={editData}
                  isEditing={isEditing}
                  onDataChange={handleDataChange}
                />
              </TabsContent>
              
              <TabsContent value="costs" className="h-full overflow-y-auto">
                <VariationCostTab
                  variation={currentVariation}
                  editData={editData}
                  isEditing={isEditing}
                  onDataChange={handleDataChange}
                />
              </TabsContent>
              
              <TabsContent value="files" className="h-full overflow-y-auto">
                <VariationFilesTab
                  variation={currentVariation}
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
                  variation={currentVariation}
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
