import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { ChecklistItem, templates } from './QAITPTemplates';
import QAITPChecklistItem from './QAITPChecklistItem';
import QAITPProjectInfo from './QAITPProjectInfo';
import QAITPSignOff from './QAITPSignOff';
import { AlertCircle, Save, X } from 'lucide-react';
import { SupabaseUploadedFile } from '@/hooks/useSupabaseFileUpload';
import { useOrganizations } from '@/hooks/useOrganizations';

interface QAITPFormProps {
  onClose: () => void;
  projectId?: string;
}

const QAITPForm: React.FC<QAITPFormProps> = ({ 
  onClose, 
  projectId
}) => {
  const { createInspection } = useQAInspectionsSimple();
  const { toast } = useToast();
  const { projects } = useProjects();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectId: projectId || '',
    projectName: '',
    taskArea: '',
    building: '',
    level: '',
    buildingReference: '',
    inspectionType: 'pre-installation',
    template: 'doors-jambs-hardware',
    trade: 'carpentry',
    inspectorName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    digitalSignature: '',
    overallStatus: 'incomplete-draft'
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isFireDoor, setIsFireDoor] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [hasUploadFailures, setHasUploadFailures] = useState(false);

  // Initialize checklist when template changes
  useEffect(() => {
    const templateChecklist = templates[formData.template as keyof typeof templates]?.items || [];
    setChecklist(templateChecklist.map(item => ({
      ...item,
      status: undefined,
      comments: '',
      evidenceFiles: []
    })));
  }, [formData.template]);

  // Form is now only for creation - no editing logic needed

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill project name when project is selected
      if (field === 'projectId' && value) {
        const selectedProject = projects.find(p => p.id === value);
        if (selectedProject) {
          updated.projectName = selectedProject.name;
        }
      }
      
      return updated;
    });
    setError(null);
  };

  const handleTemplateChange = (templateKey: string) => {
    setFormData(prev => ({ ...prev, template: templateKey }));
    if (templateKey && templates[templateKey as keyof typeof templates]) {
      setChecklist(templates[templateKey as keyof typeof templates].items);
    } else {
      setChecklist([]);
    }
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

  const validateForm = (isDraft = false) => {
    if (isDraft) {
      // For drafts, we only need project ID to be valid
      if (!formData.projectId.trim()) {
        setError('Project selection is required');
        return false;
      }
      return true;
    }

    // Full validation for complete submission
    const requiredFields = [
      { field: 'projectId', label: 'Project' },
      { field: 'taskArea', label: 'Task Area' },
      { field: 'building', label: 'Building' },
      { field: 'inspectionType', label: 'Inspection Type' },
      { field: 'template', label: 'Template' },
      { field: 'inspectorName', label: 'Inspector Name' },
      { field: 'inspectionDate', label: 'Inspection Date' },
      { field: 'digitalSignature', label: 'Digital Signature' }
    ];

    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData].trim()) {
        setError(`${label} is required`);
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

  const isFormComplete = () => {
    const requiredFields = ['projectId', 'taskArea', 'building', 'inspectionType', 'template', 'inspectorName', 'inspectionDate', 'digitalSignature'];
    return requiredFields.every(field => formData[field as keyof typeof formData].trim() !== '');
  };

  const saveDraft = async () => {
    if (!validateForm(true)) {
      return;
    }

    // Show confirmation for incomplete forms
    if (!isFormComplete()) {
      const confirmed = window.confirm(
        'This form is incomplete. Are you sure you want to save it as a draft?\n\nIncomplete fields will need to be filled before the inspection can be finalized.'
      );
      if (!confirmed) return;
    }

    setSaving(true);
    setError(null);

    try {
      // Filter checklist based on fire door setting
      const filteredChecklist = checklist.filter(item => 
        !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
      );

      // Combine building, level, and building reference for location_reference
      const locationParts = [formData.building || 'TBD'];
      if (formData.level.trim()) {
        locationParts.push(`Level ${formData.level}`);
      }
      if (formData.buildingReference.trim()) {
        locationParts.push(formData.buildingReference);
      }
      const locationReference = locationParts.join(' - ');

      // Transform camelCase UI data to snake_case database format
      const inspectionData = {
        project_id: formData.projectId,
        project_name: formData.projectName || 'Draft Inspection',
        task_area: formData.taskArea || 'TBD',
        location_reference: locationReference,
        inspection_type: (formData.inspectionType || 'pre-installation') as 'pre-installation' | 'final' | 'progress',
        template_type: formData.template as 'doors-jambs-hardware' | 'skirting',
        trade: formData.trade,
        is_fire_door: isFireDoor,
        inspector_name: formData.inspectorName || 'TBD',
        inspection_date: formData.inspectionDate,
        digital_signature: formData.digitalSignature || 'TBD',
        overall_status: 'incomplete-draft' as const
      };

      const checklistItems = filteredChecklist.map(item => {
        // Extract file paths from SupabaseUploadedFile objects
        let evidenceFileNames: string[] = [];
        if (item.evidenceFiles && Array.isArray(item.evidenceFiles)) {
          evidenceFileNames = item.evidenceFiles
            .filter((file): file is SupabaseUploadedFile => 
              file && 
              typeof file === 'object' && 
              'uploaded' in file && 
              'path' in file && 
              file.uploaded === true
            )
            .map(file => file.path);
        }

        return {
          item_id: item.id,
          description: item.description,
          requirements: item.requirements,
          status: item.status || '',
          comments: item.comments || '',
          evidence_files: evidenceFileNames.length > 0 ? evidenceFileNames : []
        };
      });

      const result = await createInspection(inspectionData, checklistItems);

      if (result) {
        toast({
          title: "Draft Saved",
          description: isFormComplete() ? "Complete inspection saved successfully" : "Incomplete draft saved. You can complete it later."
        });
        onClose();
      } else {
        setError('Failed to save draft. Please try again.');
      }
    } catch (error) {
      console.error('Error saving QA inspection draft:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Filter checklist based on fire door setting
      const filteredChecklist = checklist.filter(item => 
        !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
      );

      // Combine building, level, and building reference for location_reference
      const locationParts = [formData.building];
      if (formData.level.trim()) {
        locationParts.push(`Level ${formData.level}`);
      }
      if (formData.buildingReference.trim()) {
        locationParts.push(formData.buildingReference);
      }
      const locationReference = locationParts.join(' - ');

      // Transform camelCase UI data to snake_case database format
      const inspectionData = {
        project_id: formData.projectId,
        project_name: formData.projectName,
        task_area: formData.taskArea,
        location_reference: locationReference,
        inspection_type: formData.inspectionType as 'pre-installation' | 'final' | 'progress',
        template_type: formData.template as 'doors-jambs-hardware' | 'skirting',
        trade: formData.trade,
        is_fire_door: isFireDoor,
        inspector_name: formData.inspectorName,
        inspection_date: formData.inspectionDate,
        digital_signature: formData.digitalSignature,
        overall_status: 'incomplete-in-progress' as const
      };

      const checklistItems = filteredChecklist.map(item => {
        // Extract file paths from SupabaseUploadedFile objects
        let evidenceFileNames: string[] = [];
        if (item.evidenceFiles && Array.isArray(item.evidenceFiles)) {
          evidenceFileNames = item.evidenceFiles
            .filter((file): file is SupabaseUploadedFile => 
              file && 
              typeof file === 'object' && 
              'uploaded' in file && 
              'path' in file && 
              file.uploaded === true
            )
            .map(file => file.path);
        }

        return {
          item_id: item.id,
          description: item.description,
          requirements: item.requirements,
          status: item.status || '',
          comments: item.comments || '',
          evidence_files: evidenceFileNames.length > 0 ? evidenceFileNames : []
        };
      });

      const result = await createInspection(inspectionData, checklistItems);

      if (result) {
        toast({
          title: "Success",
          description: "QA inspection created successfully"
        });
        onClose();
      } else {
        setError('Failed to create inspection. Please try again.');
      }
    } catch (error) {
      console.error('Error saving QA inspection:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filteredChecklist = checklist.filter(item => 
    !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Create New QA Inspection
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={saveDraft}
                disabled={saving || uploadingFiles}
                variant={isFormComplete() ? "default" : "secondary"}
              >
                <Save className="h-4 w-4 mr-2" />
                {isFormComplete() ? 'Create Inspection' : 'Save Draft'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {!isFormComplete() && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span>Form is incomplete. You can save as draft or complete all required fields to create the inspection.</span>
            </div>
          )}

          <QAITPProjectInfo 
            formData={formData}
            isFireDoor={isFireDoor}
            projects={projects}
            onFormDataChange={handleFormDataChange}
            onFireDoorChange={setIsFireDoor}
            onTemplateChange={handleTemplateChange}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inspection Checklist</h3>
            {filteredChecklist.map((item) => (
              <QAITPChecklistItem
                key={item.id}
                item={item}
                onChecklistChange={handleChecklistChange}
                onUploadStatusChange={handleUploadStatusChange}
              />
            ))}
          </div>

          <QAITPSignOff
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />

          <div className="flex justify-between items-center">
            <Button 
              onClick={saveDraft}
              disabled={saving || uploadingFiles}
              variant="secondary"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={saving || uploadingFiles || !isFormComplete()}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Inspection'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAITPForm;