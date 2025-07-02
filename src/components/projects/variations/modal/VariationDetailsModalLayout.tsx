
import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Save, X } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useVariationEditPermissions } from '@/hooks/useVariationEditPermissions';
import VariationModalTabs from './VariationModalTabs';
import VariationStatusNotification from './VariationStatusNotification';

interface VariationDetailsModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  variation: any;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onVariationUpdate?: (updatedVariation: any) => void;
}

const VariationDetailsModalLayout: React.FC<VariationDetailsModalLayoutProps> = ({
  isOpen,
  onClose,
  variation,
  onUpdate,
  onVariationUpdate
}) => {
  const { toast } = useToast();
  const { isDeveloper, canEdit } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentVariation, setCurrentVariation] = useState(variation);

  // Use the dedicated edit permissions hook
  const { canEditVariation, editBlockedReason, isPendingApproval, isStatusLocked } = useVariationEditPermissions(currentVariation);

  // Update current variation when prop changes (for real-time updates)
  useEffect(() => {
    if (variation) {
      setCurrentVariation(variation);
      // Reset editing state if status has changed to locked
      if (isEditing && !canEditVariation) {
        setIsEditing(false);
        setEditData({});
      }
    }
  }, [variation, canEditVariation, isEditing]);

  const handleEdit = useCallback(() => {
    if (editBlockedReason) {
      toast({
        title: "Cannot Edit",
        description: editBlockedReason,
        variant: "destructive"
      });
      return;
    }

    setEditData({
      title: currentVariation.title,
      description: currentVariation.description || '',
      location: currentVariation.location || '',
      cost_impact: currentVariation.cost_impact,
      time_impact: currentVariation.time_impact,
      category: currentVariation.category || '',
      priority: currentVariation.priority,
      client_email: currentVariation.client_email || '',
      justification: currentVariation.justification || '',
      requires_eot: currentVariation.requires_eot || false,
      requires_nod: currentVariation.requires_nod || false,
      trade: currentVariation.trade || '',
      cost_breakdown: currentVariation.cost_breakdown || [],
      gst_amount: currentVariation.gst_amount || 0,
      total_amount: currentVariation.total_amount || 0
    });
    setIsEditing(true);
  }, [currentVariation, editBlockedReason, toast]);

  const handleSave = useCallback(async () => {
    if (!onUpdate || !canEditVariation) return;
    
    setSaveLoading(true);
    try {
      await onUpdate(currentVariation.id, editData);
      setIsEditing(false);
      const updatedVariation = { ...currentVariation, ...editData };
      setCurrentVariation(updatedVariation);
      if (onVariationUpdate) {
        onVariationUpdate(updatedVariation);
      }
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
    } finally {
      setSaveLoading(false);
    }
  }, [currentVariation, editData, onUpdate, onVariationUpdate, canEditVariation, toast]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  const handleDataChange = useCallback((changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
  }, []);

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

  // Handle null variation case
  if (!currentVariation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Variation Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">The requested variation could not be loaded.</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Variation {currentVariation.variation_number}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-lg font-semibold">{currentVariation.title}</h3>
                {getStatusBadge(currentVariation.status)}
              </div>
            </div>
            <div className="flex gap-2">
              {!isEditing && canEditVariation && currentVariation.status === 'draft' && (
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
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveLoading ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <VariationStatusNotification
          canEditVariation={canEditVariation}
          editBlockedReason={editBlockedReason}
          isPendingApproval={isPendingApproval}
          isStatusLocked={isStatusLocked}
        />

        <VariationModalTabs
          variation={currentVariation}
          editData={editData}
          isEditing={isEditing}
          canEditVariation={canEditVariation}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDataChange={handleDataChange}
          onUpdate={onUpdate}
          onVariationUpdate={(updatedVar) => {
            setCurrentVariation(updatedVar);
            if (onVariationUpdate) onVariationUpdate(updatedVar);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VariationDetailsModalLayout;
