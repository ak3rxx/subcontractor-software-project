
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQAInspections } from '@/hooks/useQAInspections';
import { useToast } from '@/hooks/use-toast';
import { ChecklistItem, templates } from './QAITPTemplates';
import QAITPChecklistItem from './QAITPChecklistItem';
import QAITPProjectInfo from './QAITPProjectInfo';
import QAITPSignOff from './QAITPSignOff';
import { AlertCircle, Save, X } from 'lucide-react';

interface QAITPFormProps {
  onClose: () => void;
  projectId?: string;
  editingInspection?: any;
}

const QAITPForm: React.FC<QAITPFormProps> = ({ 
  onClose, 
  projectId,
  editingInspection 
}) => {
  const { createInspection, updateInspection } = useQAInspections();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    project_id: projectId || '',
    project_name: '',
    task_area: '',
    location_reference: '',
    inspection_type: 'post-installation' as 'post-installation' | 'final' | 'progress',
    template_type: 'doors-jambs-hardware' as 'doors-jambs-hardware' | 'skirting',
    is_fire_door: false,
    inspector_name: '',
    inspection_date: new Date().toISOString().split('T')[0],
    digital_signature: '',
    overall_status: 'incomplete-in-progress' as 'pass' | 'fail' | 'pending-reinspection' | 'incomplete-in-progress'
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [hasUploadFailures, setHasUploadFailures] = useState(false);

  // Initialize checklist when template changes
  useEffect(() => {
    const templateChecklist = templates[formData.template_type]?.items || [];
    setChecklist(templateChecklist.map(item => ({
      ...item,
      status: undefined,
      comments: '',
      evidenceFiles: []
    })));
  }, [formData.template_type]);

  // Populate form if editing
  useEffect(() => {
    if (editingInspection) {
      setFormData({
        project_id: editingInspection.project_id,
        project_name: editingInspection.project_name,
        task_area: editingInspection.task_area,
        location_reference: editingInspection.location_reference,
        inspection_type: editingInspection.inspection_type,
        template_type: editingInspection.template_type,
        is_fire_door: editingInspection.is_fire_door,
        inspector_name: editingInspection.inspector_name,
        inspection_date: editingInspection.inspection_date,
        digital_signature: editingInspection.digital_signature,
        overall_status: editingInspection.overall_status
      });
    }
  }, [editingInspection]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user makes changes
  };

  const handleChecklistChange = (itemId: string, field: string, value: any) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleUploadStatusChange = (isUploading: boolean, hasFailures: boolean) => {
    setUploadingFiles(isUploading);
    setHasUploadFailures(hasFailures);
  };

  const validateForm = () => {
    const requiredFields = [
      'project_id', 'project_name', 'task_area', 'location_reference',
      'inspector_name', 'inspection_date', 'digital_signature'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        setError(`${field.replace('_', ' ')} is required`);
        return false;
      }
    }

    if (uploadingFiles) {
      setError('Please wait for file uploads to complete');
      return false;
    }

    if (hasUploadFailures) {
      setError('Some file uploads failed. Please retry or remove failed uploads.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log('Submitting QA inspection form:', formData);
      
      const checklistItems = checklist.map(item => ({
        item_id: item.id,
        description: item.description,
        requirements: item.requirements,
        status: item.status || '',
        comments: item.comments || '',
        evidence_files: item.evidenceFiles ? item.evidenceFiles.map(f => f.name || f.url || '') : []
      }));

      let result;
      if (editingInspection) {
        result = await updateInspection(editingInspection.id, formData, checklistItems);
      } else {
        result = await createInspection(formData, checklistItems);
      }

      if (result) {
        console.log('QA inspection saved successfully:', result.id);
        toast({
          title: "Success",
          description: `QA inspection ${editingInspection ? 'updated' : 'created'} successfully`
        });
        onClose();
      } else {
        setError('Failed to save inspection. Please try again.');
      }
    } catch (error) {
      console.error('Error saving QA inspection:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {editingInspection ? 'Edit QA Inspection' : 'Create New QA Inspection'}
            </CardTitle>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <QAITPProjectInfo 
            formData={formData}
            onInputChange={handleInputChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspection_type">Inspection Type</Label>
              <Select 
                value={formData.inspection_type} 
                onValueChange={(value) => handleInputChange('inspection_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inspection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post-installation">Post Installation</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_type">Template Type</Label>
              <Select 
                value={formData.template_type} 
                onValueChange={(value) => handleInputChange('template_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doors-jambs-hardware">Doors, Jambs & Hardware</SelectItem>
                  <SelectItem value="skirting">Skirting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_fire_door"
              checked={formData.is_fire_door}
              onCheckedChange={(checked) => handleInputChange('is_fire_door', checked)}
            />
            <Label htmlFor="is_fire_door">Fire Door Inspection</Label>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inspection Checklist</h3>
            {checklist.map((item) => (
              <QAITPChecklistItem
                key={item.id}
                item={item}
                onChecklistChange={handleChecklistChange}
                onUploadStatusChange={handleUploadStatusChange}
                inspectionId={editingInspection?.id}
              />
            ))}
          </div>

          <QAITPSignOff
            formData={formData}
            onInputChange={handleInputChange}
          />

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving || uploadingFiles}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : editingInspection ? 'Update Inspection' : 'Save Inspection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAITPForm;
