import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, AlertTriangle, Clock, Upload, Save, Trash2 } from 'lucide-react';
import FileThumbnailViewer from './FileThumbnailViewer';
import SupabaseFileUpload from './SupabaseFileUpload';
import { supabase } from '@/integrations/supabase/client';

interface QAChecklistEditableTabProps {
  inspection: any;
  isEditing: boolean;
  onUpdate?: (updatedInspection: any) => void;
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
  onUpdate
}) => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { getChecklistItems } = useQAInspectionsSimple();
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
  const handleStatusChange = useCallback((itemId: string, newStatus: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );
    setHasChanges(true);
  }, []);

  // Handle comments change
  const handleCommentsChange = useCallback((itemId: string, newComments: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, comments: newComments } : item
      )
    );
    setHasChanges(true);
  }, []);

  // Handle file upload completion
  const handleFileUpload = useCallback((itemId: string, filePath: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, evidence_files: [...(item.evidence_files || []), filePath] }
          : item
      )
    );
    setHasChanges(true);
  }, []);

  // Handle file removal
  const handleFileRemove = useCallback((itemId: string, filePath: string) => {
    setChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, evidence_files: (item.evidence_files || []).filter(f => f !== filePath) }
          : item
      )
    );
    setHasChanges(true);
  }, []);

  // Custom function to update checklist items in database
  const updateChecklistItem = useCallback(async (itemId: string, updates: { status: string; comments: string; evidence_files: string[] }) => {
    const { error } = await supabase
      .from('qa_checklist_items')
      .update({
        status: updates.status,
        comments: updates.comments,
        evidence_files: updates.evidence_files.length > 0 ? updates.evidence_files : null
      })
      .eq('id', itemId);

    if (error) {
      throw error;
    }
  }, []);

  // Save all changes
  const handleSaveChanges = useCallback(async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      // Save each modified item
      const savePromises = checklistItems.map(item => 
        updateChecklistItem(item.id, {
          status: item.status,
          comments: item.comments,
          evidence_files: item.evidence_files
        })
      );

      await Promise.all(savePromises);
      
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Checklist items updated successfully"
      });

      // Notify parent of update
      if (onUpdate) {
        onUpdate(inspection);
      }
    } catch (error) {
      console.error('Error saving checklist items:', error);
      toast({
        title: "Error",
        description: "Failed to save checklist items",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [hasChanges, checklistItems, updateChecklistItem, toast, onUpdate, inspection]);

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
            {isEditing && hasChanges && (
              <Button 
                onClick={handleSaveChanges} 
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
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
                        <Select
                          value={item.status || ''}
                          onValueChange={(value) => handleStatusChange(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                            <SelectItem value="na">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

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
                           <SupabaseFileUpload
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