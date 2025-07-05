import React, { useState, useCallback, useMemo, memo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Edit, 
  Save, 
  X, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  Clipboard, 
  History,
  Download,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { useToast } from '@/hooks/use-toast';
import { useQAPermissions } from '@/hooks/useQAPermissions';
import QADetailsTab from './QADetailsTab';
import QAChecklistEditableTab from './QAChecklistEditableTab';
import QAAttachmentsTab from './QAAttachmentsTab';
import QAChangeHistory from './QAChangeHistory';
import QACrossModuleIntegration from './QACrossModuleIntegration';

interface QAInspectionModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
  onUpdate?: (updatedInspection: any) => void;
}

const QAInspectionModalEnhanced: React.FC<QAInspectionModalEnhancedProps> = memo(({
  isOpen,
  onClose,
  inspection,
  onUpdate
}) => {
  console.log('QA Modal: Rendering with inspection:', inspection?.id, 'isOpen:', isOpen);
  
  const { updateInspection } = useQAInspectionsSimple(inspection?.project_id);
  const { changeHistory, recordChange } = useQAChangeHistory(inspection?.id);
  const { toast } = useToast();
  const qaPermissions = useQAPermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Check if opening in edit mode and auto-enable editing if permitted
  useEffect(() => {
    if (inspection?._openInEditMode && qaPermissions.canEditInspections) {
      setIsEditing(true);
      setActiveTab('details'); // Ensure details tab is active
      // Initialize edit data
      setEditData({
        project_name: inspection.project_name || '',
        task_area: inspection.task_area || '',
        location_reference: inspection.location_reference || '',
        inspection_type: inspection.inspection_type || '',
        template_type: inspection.template_type || '',
        inspector_name: inspection.inspector_name || '',
        inspection_date: inspection.inspection_date || '',
        overall_status: inspection.overall_status || '',
        digital_signature: inspection.digital_signature || '',
        is_fire_door: inspection.is_fire_door || false
      });
    }
  }, [inspection?._openInEditMode, qaPermissions.canEditInspections]);

  // Initialize edit data when switching to edit mode - memoized to prevent re-renders
  const handleEditClick = useCallback(() => {
    if (!inspection) return;
    
    // Check permissions
    if (!qaPermissions.canEditInspections) {
      toast({
        title: "Permission Denied",
        description: qaPermissions.denialReason,
        variant: "destructive"
      });
      return;
    }
    
    setEditData({
      project_name: inspection.project_name || '',
      task_area: inspection.task_area || '',
      location_reference: inspection.location_reference || '',
      inspection_type: inspection.inspection_type || '',
      template_type: inspection.template_type || '',
      inspector_name: inspection.inspector_name || '',
      inspection_date: inspection.inspection_date || '',
      overall_status: inspection.overall_status || '',
      digital_signature: inspection.digital_signature || '',
      is_fire_door: inspection.is_fire_door || false
    });
    setIsEditing(true);
    setUnsavedChanges(false);
    setActiveTab('details'); // Auto-open details tab when editing
  }, [inspection?.id, qaPermissions, toast]); // Only re-create when inspection ID changes

  const handleDataChange = useCallback((changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
    setUnsavedChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!unsavedChanges) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const updatedInspection = await updateInspection(inspection.id, editData);
      if (updatedInspection) {
        toast({
          title: "Success",
          description: "Inspection updated successfully"
        });
        setIsEditing(false);
        setUnsavedChanges(false);
        onUpdate?.(updatedInspection);
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to update inspection",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [inspection.id, editData, unsavedChanges, updateInspection, toast, onUpdate]);

  const handleCancel = useCallback(() => {
    if (unsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setIsEditing(false);
        setEditData({});
        setUnsavedChanges(false);
      }
    } else {
      setIsEditing(false);
      setEditData({});
    }
  }, [unsavedChanges]);

  const getStatusBadge = useMemo(() => {
    const status = inspection?.overall_status;
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
  }, [inspection?.overall_status]);

  const inspectionInfo = useMemo(() => [
    {
      icon: User,
      label: 'Inspector',
      value: inspection?.inspector_name,
      color: 'text-blue-600'
    },
    {
      icon: Calendar,
      label: 'Inspection Date',
      value: inspection?.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yyyy') : 'N/A',
      color: 'text-green-600'
    },
    {
      icon: MapPin,
      label: 'Location',
      value: inspection?.location_reference,
      color: 'text-purple-600'
    },
    {
      icon: Clipboard,
      label: 'Template Type',
      value: inspection?.template_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      color: 'text-orange-600'
    }
  ], [inspection]);

  if (!inspection) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                QA Inspection {inspection.inspection_number}
              </DialogTitle>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-muted-foreground">
                  {inspection.task_area}
                </h3>
                {getStatusBadge}
                {inspection.is_fire_door && (
                  <Badge variant="destructive" className="text-xs">🔥 Fire Door</Badge>
                )}
                {unsavedChanges && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Unsaved Changes
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saving || !unsavedChanges}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Info Bar */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspectionInfo.map((info, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <info.icon className={`h-4 w-4 ${info.color}`} />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{info.label}</p>
                      <p className="text-sm font-medium">{info.value || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cross-Module Integration */}
          {!isEditing && (
            <QACrossModuleIntegration inspection={inspection} />
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Attachments
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit Trail
                {changeHistory.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {changeHistory.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="details" className="h-full">
                <QADetailsTab
                  inspection={inspection}
                  editData={editData}
                  isEditing={isEditing}
                  onDataChange={handleDataChange}
                  recordChange={recordChange}
                />
              </TabsContent>

              <TabsContent value="checklist" className="h-full">
                <QAChecklistEditableTab
                  inspection={inspection}
                  isEditing={isEditing}
                  onUpdate={onUpdate}
                />
              </TabsContent>

              <TabsContent value="attachments" className="h-full">
                <QAAttachmentsTab
                  inspection={inspection}
                  isEditing={isEditing}
                />
              </TabsContent>

              <TabsContent value="history" className="h-full">
                <QAChangeHistory
                  inspectionId={inspection.id}
                  changeHistory={changeHistory}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default QAInspectionModalEnhanced;