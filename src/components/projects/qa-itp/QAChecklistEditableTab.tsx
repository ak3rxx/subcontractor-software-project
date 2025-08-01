import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Clock, Upload, Save, Trash2 } from 'lucide-react';
import FileThumbnailViewer from './FileThumbnailViewer';
import SimpleFileUpload from './SimpleFileUpload';
import FieldAuditNote from './FieldAuditNote';
import { supabase } from '@/integrations/supabase/client';

interface QAChecklistEditableTabProps {
  inspection: any;
  isEditing: boolean;
  onUpdate?: (updatedInspection: any) => void;
  onChecklistChange?: (items: any[]) => void;
}

interface ChecklistItem {
  id: string;
  item_id: string;
  description: string;
  requirements: string;
  status: string;
  comments: string;
  evidence_files: string[];
  inspection_id: string;
}

const QAChecklistEditableTab: React.FC<QAChecklistEditableTabProps> = memo(({
  inspection,
  isEditing,
  onUpdate,
  onChecklistChange
}) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { getChecklistItems } = useQAInspectionsSimple();
  const { changeHistory, recordChange } = useQAChangeHistory(inspection?.id);
  const { toast } = useToast();

  // Load checklist items
  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (inspection?.id) {
        setLoading(true);
        try {
          const items = await getChecklistItems(inspection.id);
          setChecklistItems(items || []);
        } catch (error) {
          console.error('Error fetching checklist items:', error);
          toast({
            title: "Error",
            description: "Failed to load checklist items",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChecklistItems();
  }, [inspection?.id, getChecklistItems, toast]);

  // Handle item status change
  const handleStatusChange = useCallback(async (itemId: string, newStatus: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    const oldStatus = item?.status || '';
    
    const updatedItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, status: newStatus } : item
    );
    setChecklistItems(updatedItems);
    setHasChanges(true);
    
    // Record the change for audit trail
    if (recordChange && inspection?.id && item) {
      await recordChange(
        'status',
        oldStatus,
        newStatus,
        'update',
        item.item_id,
        item.description
      );
    }
    
    // Notify parent modal about changes
    onChecklistChange?.(updatedItems);
  }, [checklistItems, onChecklistChange, recordChange, inspection?.id]);

  // Handle comments change
  const handleCommentsChange = useCallback(async (itemId: string, newComments: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    const oldComments = item?.comments || '';
    
    const updatedItems = checklistItems.map(item => 
      item.id === itemId ? { ...item, comments: newComments } : item
    );
    setChecklistItems(updatedItems);
    setHasChanges(true);
    
    // Record the change for audit trail (debounced approach for text fields)
    if (recordChange && inspection?.id && item && oldComments !== newComments) {
      await recordChange(
        'comments',
        oldComments,
        newComments,
        'update',
        item.item_id,
        item.description
      );
    }
    
    // Notify parent modal about changes
    onChecklistChange?.(updatedItems);
  }, [checklistItems, onChecklistChange, recordChange, inspection?.id]);

  // Handle file upload completion
  const handleFileUpload = useCallback(async (itemId: string, filePath: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    const fileName = filePath.split('/').pop();
    
    const updatedItems = checklistItems.map(item => 
      item.id === itemId 
        ? { ...item, evidence_files: [...(item.evidence_files || []), filePath] }
        : item
    );
    setChecklistItems(updatedItems);
    setHasChanges(true);
    
    // Record the change for audit trail
    if (recordChange && inspection?.id && item) {
      await recordChange(
        'evidence_files',
        null,
        `Added file: ${fileName}`,
        'update',
        item.item_id,
        item.description
      );
    }
    
    // Notify parent modal about changes
    onChecklistChange?.(updatedItems);
  }, [checklistItems, onChecklistChange, recordChange, inspection?.id]);

  // Handle file removal - mark as removed in audit trail but keep for evidence
  const handleFileRemove = useCallback(async (itemId: string, filePath: string) => {
    const item = checklistItems.find(i => i.id === itemId);
    const fileName = filePath.split('/').pop();
    
    // Only hide from UI, don't actually remove the file reference
    const updatedItems = checklistItems.map(item => 
      item.id === itemId 
        ? { ...item, evidence_files: (item.evidence_files || []).filter(f => f !== filePath) }
        : item
    );
    setChecklistItems(updatedItems);
    setHasChanges(true);
    
    // Record the change for audit trail - mark as removed but keep evidence
    if (recordChange && inspection?.id && item) {
      await recordChange(
        'evidence_files',
        `File marked as removed: ${fileName}`,
        `File removed from active view but preserved for audit trail`,
        'update',
        item.item_id,
        item.description
      );
    }
    
    // Notify parent modal about changes
    onChecklistChange?.(updatedItems);
  }, [checklistItems, onChecklistChange, recordChange, inspection?.id]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'na':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'na':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <span className="ml-2">Loading checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inspection Checklist</CardTitle>
          </div>
          {isEditing && (
            <p className="text-sm text-muted-foreground">
              {hasChanges ? 'You have unsaved changes' : 'Edit checklist items below'}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {checklistItems.length > 0 ? (
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.description}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.requirements}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!isEditing ? (
                        <>
                          {getStatusIcon(item.status)}
                          <Badge className={getStatusColor(item.status)}>
                            {item.status === 'na' ? 'N/A' : (item.status || 'Not Checked').toUpperCase()}
                          </Badge>
                        </>
                      ) : (
                        <div className="flex gap-1">
                          {['pass', 'fail', 'na'].map((status) => (
                            <Button
                              key={status}
                              variant={item.status === status ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleStatusChange(item.id, status)}
                              className={`px-3 py-1 text-xs ${
                                item.status === status 
                                  ? status === 'pass' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : status === 'fail'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-600 hover:bg-gray-700'
                                  : 'hover:bg-muted'
                              }`}
                            >
                              {status === 'pass' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {status === 'fail' && <XCircle className="h-3 w-3 mr-1" />}
                              {status === 'na' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'N/A'}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                   {/* Status Audit Trail */}
                   <FieldAuditNote 
                     fieldName="status" 
                     changeHistory={changeHistory.filter(ch => ch.item_id === item.item_id && ch.field_name === 'status')}
                     className="mt-2"
                   />

                  {/* Comments Section */}
                  <div className="mb-3">
                    <label className="text-sm font-medium text-muted-foreground">Comments:</label>
                    {isEditing ? (
                      <Textarea
                        value={item.comments || ''}
                        onChange={(e) => handleCommentsChange(item.id, e.target.value)}
                        placeholder="Add comments..."
                        className="mt-1"
                        rows={2}
                      />
                    ) : (
                      <div className="mt-1">
                        {item.comments ? (
                          <p className="text-sm bg-muted p-2 rounded">{item.comments}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">No comments</p>
                        )}
                      </div>
                    )}
                     <FieldAuditNote 
                       fieldName="comments" 
                       changeHistory={changeHistory.filter(ch => ch.item_id === item.item_id && ch.field_name === 'comments')}
                       className="mt-2"
                     />
                  </div>

                  {/* Evidence Files Section */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Evidence Files:</label>
                     <div className="mt-1">
                       {item.evidence_files && item.evidence_files.length > 0 ? (
                         <div className="space-y-2">
                           <FileThumbnailViewer files={item.evidence_files} />
                           {isEditing && (
                             <div className="flex gap-2">
                               {item.evidence_files.map((filePath, index) => (
                                 <Button
                                   key={index}
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleFileRemove(item.id, filePath)}
                                   className="text-red-600 hover:text-red-700"
                                 >
                                   <Trash2 className="h-3 w-3 mr-1" />
                                   Remove {filePath.split('/').pop()}
                                 </Button>
                               ))}
                             </div>
                           )}
                         </div>
                       ) : (
                         <p className="text-sm text-muted-foreground">No evidence files</p>
                       )}
                       
                        {isEditing && (
                          <div className="mt-2">
                             <SimpleFileUpload
                               onFilesChange={(uploadedFiles) => {
                                 const successfulUploads = uploadedFiles
                                   .filter(f => f.uploaded && f.path)
                                   .map(f => f.path);
                                 if (successfulUploads.length > 0) {
                                   successfulUploads.forEach(path => handleFileUpload(item.id, path));
                                 }
                               }}
                               accept="image/*,.pdf"
                               multiple={true}
                               maxFiles={5}
                               className="w-full"
                               label="Upload Evidence"
                               inspectionId={inspection?.id}
                               checklistItemId={item.id}
                             />
                          </div>
                        )}
                        
                         <FieldAuditNote 
                           fieldName="evidence_files" 
                           changeHistory={changeHistory.filter(ch => ch.item_id === item.item_id && ch.field_name === 'evidence_files')}
                           className="mt-2"
                         />
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No checklist items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

QAChecklistEditableTab.displayName = 'QAChecklistEditableTab';

export default QAChecklistEditableTab;