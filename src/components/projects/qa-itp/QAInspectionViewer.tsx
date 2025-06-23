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
import { X, Save, Edit, FileText, User, Calendar, MapPin, CheckCircle, History, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQAInspections, QAInspection, QAChecklistItem } from '@/hooks/useQAInspections';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import QAChangeHistory from './QAChangeHistory';
import FileUpload from './FileUpload';
import { exportInspectionToPDF, downloadPDF } from '@/utils/pdfExport';

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
  const { getChecklistItems, getInspectionById, updateInspection, refetch } = useQAInspections();
  const { changeHistory, recordChange } = useQAChangeHistory(inspectionId);
  const [inspection, setInspection] = useState<QAInspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<QAChecklistItem[]>([]);
  const [originalInspection, setOriginalInspection] = useState<QAInspection | null>(null);
  const [originalChecklistItems, setOriginalChecklistItems] = useState<QAChecklistItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

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
    const oldValue = currentItem ? currentItem[field as keyof QAChecklistItem] : null;
    
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));

    // Record the change
    if (originalItem && oldValue !== value) {
      recordChange(
        field,
        String(oldValue || ''),
        String(value || ''),
        'update',
        itemId,
        originalItem.description
      );
    }
  };

  const handleChecklistItemFileChange = (itemId: string, files: File[]) => {
    setChecklistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, evidence_files: files } : item
    ));
  };

  const handleInspectionFieldChange = (field: string, value: string) => {
    if (inspection && originalInspection) {
      const oldValue = originalInspection[field as keyof QAInspection];
      
      setInspection(prev => prev ? { ...prev, [field]: value } : null);
      
      // Record the change
      if (oldValue !== value) {
        recordChange(
          field,
          String(oldValue || ''),
          String(value || ''),
          'update'
        );
      }
    }
  };

  const handleSave = async () => {
    if (!inspection) return;

    setSaving(true);
    try {
      await updateInspection(inspectionId, inspection, checklistItems);
      setEditMode(false);
      refetch();
      
      // Update the original data for future change tracking
      setOriginalInspection(inspection);
      setOriginalChecklistItems(checklistItems);
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

  const renderEvidenceFiles = (files: string[] | File[] | null) => {
    if (!files || files.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Evidence Files:</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {files.map((file, index) => {
            const isFileObject = file instanceof File;
            const fileName = isFileObject ? file.name : file;
            const fileType = isFileObject ? file.type : '';
            
            return (
              <div key={index} className="border rounded p-2 text-center">
                {(isFileObject && file.type.startsWith('image/')) || (!isFileObject && fileName.match(/\.(jpg|jpeg|png|gif)$/i)) ? (
                  <img 
                    src={isFileObject ? URL.createObjectURL(file) : fileName} 
                    alt={fileName}
                    className="evidence-image w-full h-20 object-cover rounded mb-1"
                  />
                ) : (
                  <FileText className="h-8 w-8 mx-auto mb-1 text-gray-400" />
                )}
                <p className="text-xs text-gray-600 truncate">{fileName}</p>
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
              <Button
                variant={editMode ? "destructive" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {editMode ? 'Cancel Edit' : 'Edit Inspection'}
              </Button>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={printRef} className="print-content" data-inspection-viewer>
        <Tabs defaultValue="inspection" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="inspection">Inspection Details</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="attachments">Other Attachments</TabsTrigger>
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

                          <FileUpload
                            files={Array.isArray(item.evidence_files) && item.evidence_files.every(f => f instanceof File) ? item.evidence_files as File[] : []}
                            onFilesChange={(files) => handleChecklistItemFileChange(item.id, files)}
                            label="Evidence Photos/Documents"
                            accept="image/*,.pdf,.doc,.docx"
                            maxFiles={3}
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

          <TabsContent value="attachments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other Inspection Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <FileUpload
                    files={attachmentFiles}
                    onFilesChange={setAttachmentFiles}
                    label="General Inspection Attachments"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    maxFiles={10}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {attachmentFiles.length === 0 ? (
                      <p>No other attachments uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {attachmentFiles.map((file, index) => (
                          <div key={index} className="border rounded p-3 text-center">
                            {file.type.startsWith('image/') ? (
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt={file.name}
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            ) : (
                              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                            )}
                            <p className="text-xs text-gray-600 truncate">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QAInspectionViewer;
