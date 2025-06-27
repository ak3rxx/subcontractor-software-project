
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Edit, Save, X, AlertTriangle, CheckCircle, XCircle, Clock, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { Variation } from '@/hooks/useVariations';
import { useVariationAttachments } from '@/hooks/useVariationAttachments';
import { useVariationAuditTrail } from '@/hooks/useVariationAuditTrail';
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
  // All hooks must be called before any early returns
  const { user } = useAuth();
  const { toast } = useToast();
  const { isDeveloper, canEdit } = usePermissions();
  const { logAuditEntry } = useVariationAuditTrail(variation?.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [showEditWarning, setShowEditWarning] = useState(false);

  // Always get variationId (will be undefined if no variation)
  const variationId = variation?.id;

  // Always call the attachments hook
  const {
    attachments,
    loading: attachmentsLoading,
    fetchAttachments,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment
  } = useVariationAttachments(variationId);

  // Memoized handlers - these must always be defined
  const handleDataChange = useCallback((newData: any) => {
    setEditData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
  }, []);

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!variationId) return;
    
    try {
      for (const file of files) {
        await uploadAttachment(file);
      }
      // Refresh attachments after upload
      await fetchAttachments();
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  }, [variationId, uploadAttachment, fetchAttachments]);

  // Simplified update handler without forced refreshes
  const handleUpdateFromModal = useCallback(async (id: string, updates: any) => {
    if (onUpdate) {
      try {
        console.log('Modal: Starting variation update with:', updates);
        
        await onUpdate(id, updates);
        
        console.log('Modal: Update completed successfully');
        
        // Simple toast notification
        if (updates.status) {
          toast({
            title: "Status Updated",
            description: `Variation status changed to ${updates.status.replace('_', ' ')}`,
            duration: 2000
          });
        }
        
      } catch (error) {
        console.error('Modal: Error updating variation:', error);
        throw error;
      }
    }
  }, [onUpdate, toast]);

  const getStatusBadge = useCallback((status: string) => {
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
  }, []);

  // Fetch attachments when variation changes
  useEffect(() => {
    if (variationId && isOpen) {
      fetchAttachments();
    }
  }, [variationId, isOpen, fetchAttachments]);

  // Reset edit state when variation changes - simplified without refreshKey
  useEffect(() => {
    if (variation && isOpen) {
      setEditData({
        title: variation.title,
        description: variation.description || '',
        location: variation.location || '',
        category: variation.category || '',
        trade: variation.trade || '',
        priority: variation.priority,
        client_email: variation.client_email || '',
        justification: variation.justification || '',
        time_impact: variation.time_impact,
        cost_breakdown: variation.cost_breakdown || [],
        total_amount: variation.total_amount || variation.cost_impact,
        gst_amount: variation.gst_amount || 0,
        requires_nod: variation.requires_nod || false,
        requires_eot: variation.requires_eot || false,
        nod_days: variation.nod_days || 0,
        eot_days: variation.eot_days || 0
      });
      setIsEditing(false);
      setHasUnsavedChanges(false);
      setActiveTab('details');
      setShowEditWarning(false);
    }
  }, [variation?.id, isOpen]); // Only depend on variation.id and isOpen

  // Early return after all hooks are called
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

  // Status-based edit restrictions
  const canStartEditing = canEditVariation && variation.status !== 'pending_approval';
  const isApproved = variation.status === 'approved';

  const handleEdit = () => {
    if (!canStartEditing) {
      toast({
        title: "Access Denied",
        description: variation.status === 'pending_approval' 
          ? "Cannot edit variation while it's pending approval"
          : "You don't have permission to edit variations",
        variant: "destructive"
      });
      return;
    }

    if (isApproved) {
      setShowEditWarning(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleEditConfirm = () => {
    setIsEditing(true);
    setShowEditWarning(false);
  };

  const handleSave = async () => {
    if (!onUpdate || !canEditVariation) return;
    
    try {
      const updates = { ...editData };
      
      // If variation was approved and is being edited, reset to pending approval
      if (isApproved) {
        updates.status = 'pending_approval';
        updates.approved_by = null;
        updates.approval_date = null;
        updates.approval_comments = null;
        updates.request_date = new Date().toISOString().split('T')[0];
      }
      
      await handleUpdateFromModal(variation.id, updates);
      
      // Log the edit action in audit trail
      if (user) {
        await logAuditEntry('edit', {
          comments: isApproved 
            ? "Variation edited and resubmitted for approval" 
            : "Variation details updated"
        });
      }
      
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      toast({
        title: "Success",
        description: isApproved 
          ? "Variation updated and submitted for approval"
          : "Variation updated successfully"
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
      trade: variation.trade || '',
      priority: variation.priority,
      client_email: variation.client_email || '',
      justification: variation.justification || '',
      time_impact: variation.time_impact,
      cost_breakdown: variation.cost_breakdown || [],
      total_amount: variation.total_amount || variation.cost_impact,
      gst_amount: variation.gst_amount || 0,
      requires_nod: variation.requires_nod || false,
      requires_eot: variation.requires_eot || false,
      nod_days: variation.nod_days || 0,
      eot_days: variation.eot_days || 0
    });
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const canShowApprovalTab = () => {
    // Show approval tab if variation is not in draft or if user can edit
    return variation.status !== 'draft' || canEditVariation;
  };

  // Disable approval actions when in edit mode with unsaved changes
  const isApprovalBlocked = isEditing && hasUnsavedChanges;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Variation {variation.variation_number}
                  {getStatusBadge(variation.status)}
                  {variation.status === 'pending_approval' && <Lock className="h-4 w-4 text-yellow-600" />}
                </DialogTitle>
                <DialogDescription>
                  {variation.title}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {canStartEditing && !isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEdit}
                    disabled={variation.status === 'pending_approval'}
                    className={variation.status === 'pending_approval' ? 'opacity-50' : ''}
                  >
                    <Edit className={`h-4 w-4 mr-2 ${variation.status === 'pending_approval' ? 'opacity-50' : ''}`} />
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

            {variation.status === 'pending_approval' && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-orange-800">
                    This variation is pending approval and cannot be edited until the approval process is complete.
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
                    onUpdate={handleUpdateFromModal}
                    isBlocked={isApprovalBlocked}
                  />
                </TabsContent>
              )}
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Warning Dialog for Approved Variations */}
      <AlertDialog open={showEditWarning} onOpenChange={setShowEditWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Edit Approved Variation
            </AlertDialogTitle>
            <AlertDialogDescription>
              This variation has been approved. Making changes will automatically resubmit it for approval and change its status to "Pending Approval". 
              
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <strong>Important:</strong> The variation will lose its approved status and require re-approval before implementation.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEditWarning(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditConfirm} className="bg-yellow-600 hover:bg-yellow-700">
              Continue Editing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnhancedVariationDetailsModalV2;
