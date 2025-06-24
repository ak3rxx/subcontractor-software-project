import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Save, Edit, FileText, User, Calendar, MapPin, CheckCircle, History, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQAInspections, QAInspection, QAChecklistItem } from '@/hooks/useQAInspections';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import QAChangeHistory from './QAChangeHistory';
import SupabaseFileUpload from './SupabaseFileUpload';
import { exportInspectionToPDF, downloadPDF } from '@/utils/pdfExport';
import { SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';

interface QAInspectionViewerProps {
  inspectionId: string;
  onClose: () => void;
  canEdit?: boolean;
}

const QAInspectionViewer: React.FC<QAInspectionViewerProps> = ({ 
  inspectionId, 
  onClose, 
  canEdit = true 
}) => {
  const { toast } = useToast();
  const { getChecklistItems, getInspectionById, updateInspection, deleteInspection, refetch } = useQAInspections();
  const { changeHistory, recordChange } = useQAChangeHistory(inspectionId);
  const [inspection, setInspection] = useState<QAInspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<QAChecklistItem[]>([]);
  const [originalInspection, setOriginalInspection] = useState<QAInspection | null>(null);
  const [originalChecklistItems, setOriginalChecklistItems] = useState<QAChecklistItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasUploadFailures, setHasUploadFailures] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Use ref to track change timeouts and prevent duplicate recordings
  const changeTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const debouncedRecordChange = React.useCallback((
    fieldName: string,
    oldValue: string | null,
    newValue: string | null,
    changeType: 'create' | 'update' | 'delete' = 'update',
    itemId?: string,
    itemDescription?: string
  ) => {
    const key = `${itemId || 'form'}-${fieldName}`;
    
    // Clear existing timeout for this field
    const existingTimeout = changeTimeouts.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      recordChange(fieldName, oldValue, newValue, changeType, itemId, itemDescription);
      changeTimeouts.current.delete(key);
    }, 500); // 500ms debounce

    changeTimeouts.current.set(key, timeout);
  }, [recordChange]);

  useEffect(() => {
    fetchInspectionData();
  }, [inspectionId]);

  const fetchInspectionData = async () => {
    setLoading(true);
    try {
      const [inspectionData, items] = await Promise.all([
        getInspectionById(inspectionId),
        getChecklistItems(inspectionId)
      ]);
      
      setInspection(inspectionData);
      setChecklistItems(items);
      setOriginalInspection(inspectionData);
      setOriginalChecklistItems(items);
    } catch (error) {
      console.error('Error fetching inspection data:', error);
      toast({
        title: "Error",
        description: "Failed to load inspection data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistItemChange = (itemId: string, field: string, value: any) => {
    const originalItem = originalChecklistItems.find(item => item.id === itemId);
    const currentItem = checklistItems.find(item => item.id === itemId);
    
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));

    // Record the change with debouncing
    if (originalItem && currentItem) {
      let stringOldValue: string | null = null;
      let stringNewValue: string | null = null;
      
      // Handle file attachments specially for Supabase files
      if (field === 'evidence_files') {
        const oldFiles = currentItem.evidence_files || [];
        stringOldValue = oldFiles.length > 0 ? JSON.stringify(oldFiles) : null;
        stringNewValue = value ? JSON.stringify(value) : null;
      } else {
        const oldValue = currentItem[field as keyof QAChecklistItem];
        stringOldValue = oldValue != null ? String(oldValue) : null;
        stringNewValue = value != null ? String(value) : null;
      }
      
      // Only record if values actually changed
      if (stringOldValue !== stringNewValue) {
        debouncedRecordChange(
          field, 
          stringOldValue, 
          stringNewValue, 
          'update', 
          itemId, 
          originalItem.description
        );
      }
    }
  };

  const handleChecklistItemFileChange = (itemId: string, files: SupabaseUploadedFile[] | File[]) => {
    console.log('File change for item', itemId, ':', files);
    handleChecklistItemChange(itemId, 'evidence_files', files);
  };

  const handleUploadStatusChange = (isUploading: boolean, hasFailures: boolean) => {
    setUploading(isUploading);
    setHasUploadFailures(hasFailures);
  };

  const handleInspectionFieldChange = (field: string, value: string) => {
    if (inspection && originalInspection) {
      const oldValue = originalInspection[field as keyof QAInspection];
      
      setInspection(prev => prev ? { ...prev, [field]: value } : null);
      
      // Record the change with debouncing
      if (oldValue !== value) {
        debouncedRecordChange(
          field,
          String(oldValue || ''),
          String(value || ''),
          'update'
        );
      }
    }
  };

  // Helper function to safely convert files to SupabaseUploadedFile format
  const convertFilesToSupabaseFiles = (files: string[] | SupabaseUploadedFile[] | File[] | null): SupabaseUploadedFile[] => {
    if (!files || !Array.isArray(files) || files.length === 0) return [];

    return files.map((file, index) => {
      // Type guard to check if it's already a SupabaseUploadedFile
      if (typeof file === 'object' && file !== null && 'uploaded' in file && 'path' in file) {
        return file as SupabaseUploadedFile;
      } else if (typeof file === 'string') {
        // Handle string file paths - convert to SupabaseUploadedFile format
        return {
          id: `file-${index}-${Date.now()}`,
          file: new File([], file.split('/').pop() || file), // Create a dummy File object
          url: file,
          name: file.split('/').pop() || file,
          size: 0,
          type: file.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image/jpeg' : 
                file.match(/\.pdf$/i) ? 'application/pdf' : 'application/octet-stream',
          path: file,
          uploaded: true
        } as SupabaseUploadedFile;
      } else if (file instanceof File) {
        // Handle File objects - convert to SupabaseUploadedFile format
        return {
          id: `file-${index}-${Date.now()}`,
          file: file,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          type: file.type,
          path: `temp/${file.name}`, // Temporary path for File objects
          uploaded: false // File objects are typically not yet uploaded
        } as SupabaseUploadedFile;
      } else {
        // Fallback for any other type
        return {
          id: `file-${index}-${Date.now()}`,
          file: new File([], 'unknown'),
          url: '',
          name: 'unknown',
          size: 0,
          type: 'application/octet-stream',
          path: '',
          uploaded: false
        } as SupabaseUploadedFile;
      }
    });
  };

  const handleSave = async () => {
    if (!inspection) return;

    if (uploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for all files to finish uploading before saving.",
        variant: "destructive"
      });
      return;
    }

    if (hasUploadFailures) {
      toast({
        title: "Upload Failures Detected",
        description: "Please retry failed uploads or remove failed files before saving.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Process checklist items to ensure file paths are properly formatted
      const processedChecklistItems = checklistItems.map(item => {
        let evidenceFileNames: string[] = [];
        if (item.evidence_files && Array.isArray(item.evidence_files)) {
          // Convert to SupabaseUploadedFile format first to ensure consistency
          const supabaseFiles = convertFilesToSupabaseFiles(item.evidence_files as (string[] | SupabaseUploadedFile[] | File[]));
          evidenceFileNames = supabaseFiles
            .filter(file => file.uploaded === true)
            .map(file => file.path);
        }

        return {
          ...item,
          evidence_files: evidenceFileNames.length > 0 ? evidenceFileNames : null
        };
      });

      await updateInspection(inspectionId, inspection, processedChecklistItems);
      setEditMode(false);
      refetch();
      
      // Update the original data for future change tracking
      setOriginalInspection(inspection);
      setOriginalChecklistItems(checklistItems);
      
      toast({
        title: "Success",
        description: "Inspection saved successfully",
      });
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!inspection) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete inspection ${inspection.inspection_number}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      const success = await deleteInspection(inspectionId);
      if (success) {
        toast({
          title: "Success",
          description: "Inspection deleted successfully",
        });
        onClose();
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!inspection || !printRef.current) return;

    setExportingPDF(true);
    try {
      const pdfBlob = await exportInspectionToPDF(printRef.current, {
        id: inspection.id,
        inspection_number: inspection.inspection_number,
        project_name: inspection.project_name,
        task_area: inspection.task_area,
        inspector_name: inspection.inspector_name,
        inspection_date: inspection.inspection_date,
        overall_status: inspection.overall_status
      });

      downloadPDF(pdfBlob, `QA_Inspection_${inspection.inspection_number}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Inspection report exported to PDF successfully.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export inspection to PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Reinspection</Badge>;
      case 'incomplete-in-progress':
        return <Badge className="bg-blue-100 text-blue-800">Incomplete/In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getItemStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">✓ Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">✗ Fail</Badge>;
      case 'na':
        return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
      default:
        return <Badge variant="outline">Not Checked</Badge>;
    }
  };

  const renderEvidenceFiles = (files: string[] | SupabaseUploadedFile[] | File[] | null) => {
    if (!files || files.length === 0) return null;

    const supabaseFiles = convertFilesToSupabaseFiles(files);

    // Check if there are any PDF files
    const pdfFiles = supabaseFiles.filter(file => {
      const fileName = file.name;
      const fileType = file.type;
      return fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    });

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Evidence Files:</Label>
        
        {/* PDF Files Notation */}
        {pdfFiles.length > 0 && (
          <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 mb-3">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">PDF Documents:</p>
                <ul className="text-xs text-amber-700 mt-1 space-y-1">
                  {pdfFiles.map((file, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span>•</span>
                      <span className="font-mono">{file.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {supabaseFiles.map((file, index) => {
            const fileName = file.name;
            const fileType = file.type;
            const isPDF = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
            
            return (
              <div key={index} className={`border rounded p-2 text-center relative group ${isPDF ? 'border-amber-200 bg-amber-50' : ''}`}>
                {fileType.startsWith('image/') ? (
                  <img 
                    src={file.url} 
                    alt={fileName}
                    className="evidence-image w-full h-20 object-cover rounded mb-1"
                    onError={(e) => {
                      console.error('Failed to load image:', file.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <FileText className={`h-8 w-8 mx-auto mb-1 ${isPDF ? 'text-amber-600' : 'text-gray-400'}`} />
                )}
                <p className={`text-xs truncate ${isPDF ? 'text-amber-900 font-medium' : 'text-gray-600'}`}>
                  {fileName}
                  {isPDF && <span className="block text-amber-600">(PDF)</span>}
                </p>
                
                {/* Download button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                  onClick={() => {
                    window.open(file.url, '_blank');
                  }}
                  title="Download file"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Loading Inspection...</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Inspection Not Found</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">The requested inspection could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quality Assurance / Inspection Test Plan Details
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
            {canEdit && (
              <>
                <Button
                  variant={editMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {editMode ? 'Cancel Edit' : 'Edit Inspection'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <X className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Inspection'}
                </Button>
              </>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Upload status indicator */}
      {(uploading || hasUploadFailures) && (
        <div className={`p-3 rounded-lg border ${hasUploadFailures ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-2">
            {uploading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />}
            {hasUploadFailures && <AlertCircle className="h-4 w-4 text-red-600" />}
            <span className="text-sm font-medium">
              {uploading && hasUploadFailures ? 'Uploading files with some failures detected' :
               uploading ? 'Uploading files...' : 
               'Some file uploads failed - please retry or remove failed files'}
            </span>
          </div>
        </div>
      )}

      <div ref={printRef} className="print-content" data-inspection-viewer>
        <Tabs defaultValue="inspection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inspection">Inspection Details</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspection" className="space-y-6">
            {/* Inspection Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Inspection Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Inspection Number</Label>
                    <div className="font-mono text-sm">{inspection.inspection_number}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Project</Label>
                    <div className="text-sm" data-project-name>{inspection.project_name}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Overall Status</Label>
                    {editMode ? (
                      <Select 
                        value={inspection.overall_status} 
                        onValueChange={(value) => handleInspectionFieldChange('overall_status', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                          <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
                          <SelectItem value="incomplete-in-progress">Incomplete/In Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div data-overall-status>{getStatusBadge(inspection.overall_status)}</div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Task Area
                    </Label>
                    {editMode ? (
                      <Input
                        value={inspection.task_area}
                        onChange={(e) => handleInspectionFieldChange('task_area', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm" data-task-area>{inspection.task_area}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600">Location Reference</Label>
                    {editMode ? (
                      <Input
                        value={inspection.location_reference}
                        onChange={(e) => handleInspectionFieldChange('location_reference', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm" data-location-reference>{inspection.location_reference}</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Inspector
                    </Label>
                    {editMode ? (
                      <Input
                        value={inspection.inspector_name}
                        onChange={(e) => handleInspectionFieldChange('inspector_name', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm" data-inspector-name>{inspection.inspector_name}</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Inspection Date
                    </Label>
                    {editMode ? (
                      <Input
                        type="date"
                        value={inspection.inspection_date}
                        onChange={(e) => handleInspectionFieldChange('inspection_date', e.target.value)}
                      />
                    ) : (
                      <div className="text-sm" data-inspection-date>{new Date(inspection.inspection_date).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            {/* Save button at the top of checklist */}
            {editMode && (
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={saving || uploading || hasUploadFailures}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 
                   uploading ? 'Uploading...' : 
                   hasUploadFailures ? 'Fix Upload Errors' : 
                   'Save Checklist'}
                </Button>
              </div>
            )}

            {/* Checklist Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inspection Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {checklistItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No checklist items found for this inspection.</p>
                  </div>
                ) : (
                  checklistItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3" data-checklist-item>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium" data-item-description>{item.description}</h4>
                          <p className="text-sm text-gray-600 mt-1" data-item-requirements>{item.requirements}</p>
                        </div>
                        <div className="ml-4" data-item-status>
                          {getItemStatusBadge(item.status)}
                        </div>
                      </div>
                      
                      {editMode ? (
                        <div className="space-y-3">
                          <div className="flex gap-4 items-center">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.id}-pass`}
                                checked={item.status === 'pass'}
                                onCheckedChange={(checked) => 
                                  handleChecklistItemChange(item.id, 'status', checked ? 'pass' : '')
                                }
                              />
                              <Label htmlFor={`${item.id}-pass`} className="text-green-600">Pass</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.id}-fail`}
                                checked={item.status === 'fail'}
                                onCheckedChange={(checked) => 
                                  handleChecklistItemChange(item.id, 'status', checked ? 'fail' : '')
                                }
                              />
                              <Label htmlFor={`${item.id}-fail`} className="text-red-600">Fail</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.id}-na`}
                                checked={item.status === 'na'}
                                onCheckedChange={(checked) => 
                                  handleChecklistItemChange(item.id, 'status', checked ? 'na' : '')
                                }
                              />
                              <Label htmlFor={`${item.id}-na`} className="text-gray-600">N/A</Label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`${item.id}-comments`}>Comments</Label>
                            <Textarea
                              id={`${item.id}-comments`}
                              value={item.comments || ''}
                              onChange={(e) => handleChecklistItemChange(item.id, 'comments', e.target.value)}
                              placeholder="Add comments..."
                              rows={2}
                            />
                          </div>

                          <SupabaseFileUpload
                            files={convertFilesToSupabaseFiles(item.evidence_files)}
                            onFilesChange={(files) => handleChecklistItemFileChange(item.id, files)}
                            onUploadStatusChange={handleUploadStatusChange}
                            label="Evidence Photos/Documents"
                            accept="image/*,.pdf,.doc,.docx"
                            maxFiles={3}
                            inspectionId={inspectionId}
                            checklistItemId={item.id}
                          />
                        </div>
                      ) : (
                        <>
                          {item.comments && (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <Label className="text-sm font-medium text-gray-700">Comments:</Label>
                              <p className="text-sm text-gray-600 mt-1" data-item-comments>{item.comments}</p>
                            </div>
                          )}
                          {renderEvidenceFiles(item.evidence_files)}
                        </>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <QAChangeHistory 
              inspectionId={inspectionId} 
              changeHistory={changeHistory}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Buttons */}
      {editMode && (
        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={() => setEditMode(false)}
            disabled={saving || uploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || uploading || hasUploadFailures}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 
             uploading ? 'Uploading...' : 
             hasUploadFailures ? 'Fix Upload Errors' : 
             'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QAInspectionViewer;
