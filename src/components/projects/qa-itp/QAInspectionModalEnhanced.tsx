import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import QAInspectionTabsEnhanced from './QAInspectionTabsEnhanced';

interface QAInspectionModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
  onUpdate?: (id: string, updates: any) => Promise<void>;
  onInspectionUpdate?: (updatedInspection: any) => void;
}

const QAInspectionModalEnhanced: React.FC<QAInspectionModalEnhancedProps> = ({
  isOpen,
  onClose,
  inspection,
  onUpdate,
  onInspectionUpdate
}) => {
  const { toast } = useToast();
  const { updateInspection } = useQAInspectionsSimple();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(inspection);

  // Update current inspection when prop changes
  useEffect(() => {
    if (inspection) {
      setCurrentInspection(inspection);
      // Reset edit data when inspection changes
      setEditData({
        project_name: inspection.project_name,
        task_area: inspection.task_area,
        location_reference: inspection.location_reference,
        inspection_type: inspection.inspection_type,
        template_type: inspection.template_type,
        is_fire_door: inspection.is_fire_door,
        inspector_name: inspection.inspector_name,
        inspection_date: inspection.inspection_date,
        digital_signature: inspection.digital_signature,
        overall_status: inspection.overall_status
      });
    }
  }, [inspection]);

  const handleEdit = useCallback(() => {
    setEditData({
      project_name: currentInspection.project_name,
      task_area: currentInspection.task_area,
      location_reference: currentInspection.location_reference,
      inspection_type: currentInspection.inspection_type,
      template_type: currentInspection.template_type,
      is_fire_door: currentInspection.is_fire_door,
      inspector_name: currentInspection.inspector_name,
      inspection_date: currentInspection.inspection_date,
      digital_signature: currentInspection.digital_signature,
      overall_status: currentInspection.overall_status
    });
    setIsEditing(true);
  }, [currentInspection]);

  const handleSave = useCallback(async () => {
    if (!updateInspection) return;
    
    setSaveLoading(true);
    try {
      // Prepare update data including checklist items if modified
      const updateData = { ...editData };
      
      // Transform checklist items for database format if they exist
      if (editData.checklistItems) {
        const checklistItems = editData.checklistItems.map((item: any) => ({
          item_id: item.id,
          description: item.description,
          requirements: item.requirements,
          status: item.status || '',
          comments: item.comments || '',
          evidence_files: item.evidenceFiles || []
        }));
        updateData.checklistItems = checklistItems;
      }

      await updateInspection(currentInspection.id, updateData, updateData.checklistItems);
      
      setIsEditing(false);
      const updatedInspection = { ...currentInspection, ...editData };
      setCurrentInspection(updatedInspection);
      if (onInspectionUpdate) {
        onInspectionUpdate(updatedInspection);
      }
      
      toast({
        title: "Success",
        description: "Inspection updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inspection",
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  }, [currentInspection, editData, updateInspection, onInspectionUpdate, toast]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    // Reset edit data to current inspection values
    setEditData({
      project_name: currentInspection.project_name,
      task_area: currentInspection.task_area,
      location_reference: currentInspection.location_reference,
      inspection_type: currentInspection.inspection_type,
      template_type: currentInspection.template_type,
      is_fire_door: currentInspection.is_fire_door,
      inspector_name: currentInspection.inspector_name,
      inspection_date: currentInspection.inspection_date,
      digital_signature: currentInspection.digital_signature,
      overall_status: currentInspection.overall_status
    });
  }, [currentInspection]);

  const handleDataChange = useCallback((changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">✅ Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">❌ Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-orange-100 text-orange-800">🔄 Pending Reinspection</Badge>;
      case 'incomplete-in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!currentInspection) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inspection Not Found</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">The requested inspection could not be loaded.</p>
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
                QA Inspection {currentInspection.inspection_number}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-lg font-semibold">{currentInspection.task_area}</h3>
                {getStatusBadge(isEditing ? editData.overall_status : currentInspection.overall_status)}
                {currentInspection.is_fire_door && (
                  <Badge variant="destructive" className="text-xs">🔥 Fire Door</Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saveLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={saveLoading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <QAInspectionTabsEnhanced
          inspection={currentInspection}
          editData={editData}
          isEditing={isEditing}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDataChange={handleDataChange}
          onUpdate={async (id: string, updates: any) => {
            await updateInspection(id, updates);
          }}
          onInspectionUpdate={(updatedInspection) => {
            setCurrentInspection(updatedInspection);
            if (onInspectionUpdate) onInspectionUpdate(updatedInspection);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QAInspectionModalEnhanced;