import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
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
  const { recordChange } = useQAChangeHistory(inspection?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentInspection, setCurrentInspection] = useState(inspection);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize edit data when inspection changes
  useEffect(() => {
    if (inspection) {
      console.log('Initializing inspection data:', inspection);
      setCurrentInspection(inspection);
      const initialEditData = {
        project_name: inspection.project_name || '',
        task_area: inspection.task_area || '',
        location_reference: inspection.location_reference || '',
        inspection_type: inspection.inspection_type || '',
        template_type: inspection.template_type || '',
        is_fire_door: inspection.is_fire_door || false,
        inspector_name: inspection.inspector_name || '',
        inspection_date: inspection.inspection_date || '',
        digital_signature: inspection.digital_signature || '',
        overall_status: inspection.overall_status || ''
      };
      console.log('Setting initial edit data:', initialEditData);
      setEditData(initialEditData);
    }
  }, [inspection]);

  const handleEdit = useCallback(() => {
    console.log('Starting edit mode for inspection:', currentInspection?.id);
    setIsEditing(true);
    setHasUnsavedChanges(false);
    
    // Record the start of editing session
    if (recordChange) {
      recordChange('edit_session', 'inactive', 'active', 'session_start');
    }
  }, [currentInspection, recordChange]);

  const handleSave = useCallback(async () => {
    if (!updateInspection || !currentInspection?.id) {
      console.error('Missing updateInspection function or inspection ID');
      toast({
        title: "Error",
        description: "Unable to save - missing required data",
        variant: "destructive"
      });
      return;
    }
    
    setSaveLoading(true);
    console.log('Starting save process for inspection:', currentInspection.id);
    console.log('Edit data to save:', editData);

    try {
      // Track field changes for audit trail
      const fieldsToTrack = [
        'project_name', 'task_area', 'location_reference', 'inspection_type',
        'template_type', 'is_fire_door', 'inspector_name', 'inspection_date',
        'digital_signature', 'overall_status'
      ];

      // Record individual field changes
      for (const field of fieldsToTrack) {
        const oldValue = currentInspection[field];
        const newValue = editData[field];
        
        if (oldValue !== newValue && recordChange) {
          console.log(`Recording change for ${field}: ${oldValue} -> ${newValue}`);
          await recordChange(
            field,
            String(oldValue || ''),
            String(newValue || ''),
            'field_update'
          );
        }
      }

      // Prepare the update data (excluding checklist items as they're saved in real-time)
      const updateData = { ...editData };
      delete updateData.checklistItems; // Remove checklist items as they're saved in real-time
      
      console.log('Calling updateInspection with data:', updateData);
      await updateInspection(currentInspection.id, updateData);
      
      // Update local state
      const updatedInspection = { ...currentInspection, ...editData };
      setCurrentInspection(updatedInspection);
      setIsEditing(false);
      setHasUnsavedChanges(false);
      
      // Notify parent component
      if (onInspectionUpdate) {
        onInspectionUpdate(updatedInspection);
      }

      // Record successful save
      if (recordChange) {
        await recordChange('edit_session', 'active', 'saved', 'session_end');
      }
      
      console.log('Save completed successfully');
      toast({
        title: "Success",
        description: "Inspection updated successfully"
      });

    } catch (error) {
      console.error('Save failed:', error);
      
      // Record failed save
      if (recordChange) {
        await recordChange('edit_session', 'active', 'failed', 'session_error');
      }
      
      toast({
        title: "Error",
        description: `Failed to update inspection: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setSaveLoading(false);
    }
  }, [currentInspection, editData, updateInspection, onInspectionUpdate, recordChange, toast]);

  const handleCancel = useCallback(() => {
    console.log('Canceling edit mode');
    setIsEditing(false);
    setHasUnsavedChanges(false);
    
    // Reset edit data to current inspection values
    if (currentInspection) {
      const resetData = {
        project_name: currentInspection.project_name || '',
        task_area: currentInspection.task_area || '',
        location_reference: currentInspection.location_reference || '',
        inspection_type: currentInspection.inspection_type || '',
        template_type: currentInspection.template_type || '',
        is_fire_door: currentInspection.is_fire_door || false,
        inspector_name: currentInspection.inspector_name || '',
        inspection_date: currentInspection.inspection_date || '',
        digital_signature: currentInspection.digital_signature || '',
        overall_status: currentInspection.overall_status || ''
      };
      console.log('Resetting edit data:', resetData);
      setEditData(resetData);
    }

    // Record cancel action
    if (recordChange) {
      recordChange('edit_session', 'active', 'cancelled', 'session_cancel');
    }
  }, [currentInspection, recordChange]);

  const handleDataChange = useCallback((changes: any) => {
    console.log('Data change received:', changes);
    setEditData(prev => {
      const updated = { ...prev, ...changes };
      console.log('Updated edit data:', updated);
      return updated;
    });
    setHasUnsavedChanges(true);
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
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
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
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Enhanced Save Button Bar */}
        {isEditing && (
          <div className={`flex-shrink-0 border rounded-lg p-4 mb-4 transition-all ${
            hasUnsavedChanges ? 'bg-orange-50 border-orange-200' : 'bg-muted/50 border-border'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  hasUnsavedChanges ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
                }`} />
                <span className="text-sm font-medium text-muted-foreground">
                  {hasUnsavedChanges 
                    ? 'Editing Mode - Unsaved changes in Details tab' 
                    : 'Editing Mode - Checklist changes auto-saved'
                  }
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={saveLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveLoading || !hasUnsavedChanges}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveLoading ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0">
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
            recordChange={recordChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QAInspectionModalEnhanced;
