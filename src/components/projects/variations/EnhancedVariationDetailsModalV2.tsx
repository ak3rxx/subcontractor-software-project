import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Edit, Check, X, Save, AlertTriangle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useVariationAuditTrail } from '@/hooks/useVariationAuditTrail';
import PermissionGate from '@/components/PermissionGate';
import VariationDetailsTab from './VariationDetailsTab';
import VariationCostTab from './VariationCostTab';
import VariationFilesTab from './VariationFilesTab';
import EnhancedVariationApprovalTab from './EnhancedVariationApprovalTab';
import EditConfirmationDialog from './EditConfirmationDialog';

interface EnhancedVariationDetailsModalV2Props {
  variation: any | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

const EnhancedVariationDetailsModalV2: React.FC<EnhancedVariationDetailsModalV2Props> = ({ 
  variation, 
  isOpen, 
  onClose,
  onUpdate,
  onVariationUpdate
}) => {
  const { toast } = useToast();
  const { isDeveloper, canEdit } = usePermissions();
  const { debouncedRefresh } = useVariationAuditTrail(variation?.id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  const [pendingChanges, setPendingChanges] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');

  // Enhanced permission checks
  const canEditVariation = isDeveloper() || canEdit('variations');
  const isStatusLocked = ['approved', 'rejected'].includes(variation?.status);

  // Reset state when variation changes
  useEffect(() => {
    if (variation) {
      const initialData = {
        title: variation.title,
        description: variation.description || '',
        location: variation.location || '',
        cost_impact: variation.cost_impact,
        time_impact: variation.time_impact,
        category: variation.category || '',
        trade: variation.trade || '',
        priority: variation.priority,
        client_email: variation.client_email || '',
        justification: variation.justification || '',
        requires_nod: variation.requires_nod || false,
        requires_eot: variation.requires_eot || false,
        nod_days: variation.nod_days || 0,
        eot_days: variation.eot_days || 0,
        cost_breakdown: variation.cost_breakdown || [],
        gst_amount: variation.gst_amount || 0,
        total_amount: variation.total_amount || 0
      };
      
      setEditData(initialData);
      setOriginalData(initialData);
      setPendingChanges({});
    }
  }, [variation]);

  // Track changes as they happen
  const handleDataChange = useCallback((changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
    setPendingChanges(prev => ({ ...prev, ...changes }));
  }, []);

  // Enhanced edit handler with confirmation for locked statuses
  const handleEdit = () => {
    if (!canEditVariation) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit variations",
        variant: "destructive"
      });
      return;
    }

    if (isStatusLocked) {
      setShowConfirmDialog(true);
    } else {
      setIsEditing(true);
    }
  };

  const handleConfirmEdit = () => {
    setIsEditing(true);
    setShowConfirmDialog(false);
  };

  // Simplified save handler - database trigger handles all audit logging
  const handleSave = async () => {
    if (!onUpdate || !canEditVariation) return;
    
    try {
      // Prepare update data with status change if needed
      let updatePayload = { 
        ...editData,
        updated_by: variation?.updated_by, // Ensure updated_by is set for trigger
        updated_at: new Date().toISOString()
      };
      
      if (isStatusLocked) {
        updatePayload.status = 'pending_approval';
      }

      console.log('Saving variation changes:', updatePayload);

      // Update the variation - database trigger will handle all audit logging automatically
      await onUpdate(variation.id, updatePayload);

      // Notify parent component
      if (onVariationUpdate) {
        onVariationUpdate({ ...variation, ...updatePayload });
      }

      // Trigger audit trail refresh after update
      debouncedRefresh(500, true);

      setIsEditing(false);
      setPendingChanges({});
      
      toast({
        title: "Success",
        description: "Variation updated successfully" + (isStatusLocked ? " (status reverted to pending approval)" : "")
      });
    } catch (error) {
      console.error('Error saving variation:', error);
      toast({
        title: "Error",
        description: "Failed to update variation",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditData(originalData);
    setPendingChanges({});
    setIsEditing(false);
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

  const formatCurrency = (amount: number) => {
    if (amount >= 0) {
      return `+$${amount.toLocaleString()}`;
    }
    return `-$${Math.abs(amount).toLocaleString()}`;
  };

  if (!variation) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Variation {variation.variation_number}
                  {isStatusLocked && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </DialogTitle>
                <DialogDescription>
                  Detailed information and approval workflow
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(variation.status)}
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(variation.cost_impact)}
                  </div>
                  <div className="text-xs text-gray-600">Cost Impact</div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="cost">Cost & Time</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="approval">Approval</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="details" className="h-full mt-4">
                  <VariationDetailsTab
                    variation={variation}
                    editData={editData}
                    isEditing={isEditing}
                    onDataChange={handleDataChange}
                  />
                </TabsContent>

                <TabsContent value="cost" className="h-full mt-4">
                  <VariationCostTab
                    variation={variation}
                    editData={editData}
                    isEditing={isEditing}
                    onDataChange={handleDataChange}
                  />
                </TabsContent>

                <TabsContent value="files" className="h-full mt-4">
                  <VariationFilesTab
                    variation={variation}
                    isEditing={isEditing}
                  />
                </TabsContent>

                <TabsContent value="approval" className="h-full mt-4">
                  <EnhancedVariationApprovalTab
                    variation={variation}
                    onUpdate={onUpdate || (() => Promise.resolve())}
                    onStatusChange={() => onVariationUpdate?.(variation)}
                    isBlocked={isEditing}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Edit Actions */}
          <PermissionGate module="variations" requiredLevel="write">
            <div className="flex-shrink-0 border-t pt-4">
              {!isEditing && activeTab !== 'approval' && (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Variation
                  </Button>
                </div>
              )}
              
              {isEditing && (
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </PermissionGate>
        </DialogContent>
      </Dialog>

      <EditConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmEdit}
        variationStatus={variation?.status || ''}
        variationNumber={variation?.variation_number || ''}
      />
    </>
  );
};

export default EnhancedVariationDetailsModalV2;
