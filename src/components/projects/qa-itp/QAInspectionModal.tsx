
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
import QAAttachmentsUploadTab from './QAAttachmentsUploadTab';
import QAChangeHistory from './QAChangeHistory';
import QACrossModuleIntegration from './QACrossModuleIntegration';

interface QAInspectionModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
  onUpdate?: (updatedInspection: any) => void;
}

// Error boundary component for handling subscription errors
const ErrorBoundary = ({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Modal error caught:', error);
      if (error.message?.includes('subscribe') || error.message?.includes('channel')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const QAInspectionModalEnhanced: React.FC<QAInspectionModalEnhancedProps> = memo(({
  isOpen,
  onClose,
  inspection,
  onUpdate
}) => {
  console.log('QA Modal: Rendering with inspection:', inspection?.id, 'isOpen:', isOpen);
  
  const { updateInspection, getChecklistItems } = useQAInspectionsSimple(inspection?.project_id);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // Only hook QA Change History if inspection ID exists and modal is open
  const shouldUseChangeHistory = Boolean(inspection?.id && isOpen);
  const { changeHistory, recordChange } = useQAChangeHistory(shouldUseChangeHistory ? inspection.id : '');
  
  const { toast } = useToast();
  const qaPermissions = useQAPermissions();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Track change history count for badge updates
  const [changeHistoryCount, setChangeHistoryCount] = useState(0);
  
  // Update change history count when changeHistory changes - more reliable
  useEffect(() => {
    const newCount = changeHistory?.length || 0;
    if (newCount !== changeHistoryCount) {
      console.log('Change history count updated:', newCount, 'previous:', changeHistoryCount);
      setChangeHistoryCount(newCount);
    }
  }, [changeHistory?.length]);
  
  // Unified state for all tabs
  const [checklistChanges, setChecklistChanges] = useState<any[]>([]);
  const [attachmentChanges, setAttachmentChanges] = useState<string[]>([]);
  const [hasChecklistChanges, setHasChecklistChanges] = useState(false);
  const [hasAttachmentChanges, setHasAttachmentChanges] = useState(false);

  // Handle modal errors gracefully
  useEffect(() => {
    if (modalError) {
      console.error('Modal error:', modalError);
      toast({
        title: "Modal Error",
        description: "There was an issue loading the modal. Please try again.",
        variant: "destructive"
      });
      setModalError(null);
    }
  }, [modalError, toast]);

  // Check if opening in edit mode and auto-enable editing if permitted
  useEffect(() => {
    if (inspection?._openInEditMode && qaPermissions.canEditInspections) {
      setIsEditing(true);
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
    
    try {
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
    } catch (error) {
      console.error('Error entering edit mode:', error);
      setModalError('Failed to enter edit mode');
    }
  }, [inspection?.id, qaPermissions, toast]);

  const handleDataChange = useCallback((changes: any) => {
    setEditData(prev => ({ ...prev, ...changes }));
    setUnsavedChanges(true);
  }, []);

  // Handlers for checklist changes
  const handleChecklistChange = useCallback((items: any[]) => {
    setChecklistChanges(items);
    setHasChecklistChanges(true);
    setUnsavedChanges(true);
  }, []);

  // Handlers for attachment changes
  const handleAttachmentChange = useCallback((files: string[]) => {
    setAttachmentChanges(files);
    setHasAttachmentChanges(true);
    setUnsavedChanges(true);
  }, []);

  // Check if there are any unsaved changes across all tabs
  const hasAnyChanges = useMemo(() => {
    return unsavedChanges || hasChecklistChanges || hasAttachmentChanges;
  }, [unsavedChanges, hasChecklistChanges, hasAttachmentChanges]);

  const handleSave = useCallback(async () => {
    if (!hasAnyChanges) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      // Save inspection details if changed
      let updatedInspection = inspection;
      if (unsavedChanges && Object.keys(editData).length > 0) {
        updatedInspection = await updateInspection(inspection.id, editData);
        if (!updatedInspection) {
          throw new Error('Failed to update inspection details');
        }
      }

      // Save checklist changes if any
      if (hasChecklistChanges && checklistChanges.length > 0) {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Update each modified checklist item
        const savePromises = checklistChanges.map(async (item) => {
          const { error } = await supabase
            .from('qa_checklist_items')
            .update({
              status: item.status,
              comments: item.comments,
              evidence_files: item.evidence_files?.length > 0 ? item.evidence_files : null
            })
            .eq('id', item.id);
          
          if (error) throw error;
        });

        await Promise.all(savePromises);
      }

      toast({
        title: "Success",
        description: "All changes saved successfully"
      });
      
      // Reset edit state and keep modal open in view mode
      setIsEditing(false);
      setUnsavedChanges(false);
      setHasChecklistChanges(false);
      setHasAttachmentChanges(false);
      setChecklistChanges([]);
      setAttachmentChanges([]);
      
      // Update parent component with the latest data
      onUpdate?.(updatedInspection);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [inspection.id, editData, checklistChanges, hasAnyChanges, unsavedChanges, hasChecklistChanges, hasAttachmentChanges, updateInspection, toast, onUpdate]);

  const handleCancel = useCallback(() => {
    if (hasAnyChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setIsEditing(false);
        setEditData({});
        setUnsavedChanges(false);
        setHasChecklistChanges(false);
        setHasAttachmentChanges(false);
        setChecklistChanges([]);
        setAttachmentChanges([]);
      }
    } else {
      setIsEditing(false);
      setEditData({});
      setChecklistChanges([]);
      setAttachmentChanges([]);
    }
  }, [hasAnyChanges]);

  // Track the latest status from edit data or inspection
  const currentStatus = editData?.overall_status || inspection?.overall_status;
  
  const getStatusBadge = useMemo(() => {
    const status = currentStatus;
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
  }, [currentStatus]);

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
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-red-600">There was an error loading the inspection details.</p>
        <Button onClick={onClose} variant="outline" className="mt-2">Close</Button>
      </div>
    }>
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
                  {hasAnyChanges && (
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
                      disabled={saving || !hasAnyChanges}
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
                  {shouldUseChangeHistory && changeHistoryCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {changeHistoryCount}
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
                    recordChange={shouldUseChangeHistory ? recordChange : undefined}
                  />
                </TabsContent>

                <TabsContent value="checklist" className="h-full">
                  <QAChecklistEditableTab
                    inspection={inspection}
                    isEditing={isEditing}
                    onUpdate={onUpdate}
                    onChecklistChange={handleChecklistChange}
                  />
                </TabsContent>

                <TabsContent value="attachments" className="h-full">
                  <QAAttachmentsUploadTab
                    inspection={inspection}
                    isEditing={isEditing}
                    onAttachmentChange={handleAttachmentChange}
                  />
                </TabsContent>

                <TabsContent value="history" className="h-full">
                  {shouldUseChangeHistory ? (
                    <QAChangeHistory
                      inspectionId={inspection.id}
                      changeHistory={changeHistory}
                    />
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Change history is not available when modal is closed.
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  );
});

export default QAInspectionModalEnhanced;
