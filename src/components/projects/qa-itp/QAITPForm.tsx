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
import { useQAInspectionCoordination } from '@/hooks/useDataCoordination';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';

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
  const { projects, refetch: refetchProjects } = useProjects();
  const { addNotification } = useSmartNotifications();
  
  // Coordinate data updates with other components
  useQAInspectionCoordination(refetchProjects);
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

  // Calculate overall status based on checklist items
  const calculateOverallStatus = (checklistItems: ChecklistItem[], isFormComplete: boolean): 'pass' | 'fail' | 'pending-reinspection' | 'incomplete-in-progress' | 'incomplete-draft' => {
    if (!isFormComplete) {
      return 'incomplete-in-progress';
    }

    // Filter out items that are not filled (status is empty, undefined, or null)
    const completedItems = checklistItems.filter(item => 
      item.status && item.status.trim() !== ''
    );

    // If no items are completed, form is incomplete
    if (completedItems.length === 0) {
      return 'incomplete-in-progress';
    }

    // Count pass/fail items (excluding N/A)
    const passFailItems = completedItems.filter(item => 
      item.status === 'pass' || item.status === 'fail'
    );

    // If all items are N/A, consider it pass
    if (passFailItems.length === 0) {
      return 'pass';
    }

    // Count failed items
    const failedItems = passFailItems.filter(item => item.status === 'fail');
    const failPercentage = failedItems.length / passFailItems.length;

    // Apply business rules
    if (failedItems.length === 0) {
      return 'pass'; // All items passed
    } else if (failPercentage >= 0.5) {
      return 'fail'; // 50% or more failed
    } else {
      return 'pending-reinspection'; // Less than 50% failed
    }
  };

  // Field mapping for focusing functionality
  const fieldMapping = {
    projectId: { id: 'qa-project-select', label: 'Project' },
    taskArea: { id: 'qa-task-area', label: 'Task Area' },
    building: { id: 'qa-building', label: 'Building' },
    inspectionType: { id: 'qa-inspection-type', label: 'Inspection Type' },
    template: { id: 'qa-template', label: 'Template' },
    inspectorName: { id: 'qa-inspector-name', label: 'Inspector Name' },
    inspectionDate: { id: 'qa-inspection-date', label: 'Inspection Date' },
    digitalSignature: { id: 'qa-digital-signature', label: 'Digital Signature' }
  };

  const focusFirstIncompleteField = (firstIncompleteField: string) => {
    const fieldInfo = fieldMapping[firstIncompleteField as keyof typeof fieldMapping];
    if (!fieldInfo) return;

    const element = document.getElementById(fieldInfo.id);
    if (element) {
      // Scroll to the field with smooth behavior
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', 
        inline: 'nearest' 
      });
      
      // Focus the field after a short delay to ensure scrolling completes
      setTimeout(() => {
        element.focus();
        // Add temporary highlighting
        element.style.border = '2px solid #ef4444';
        element.style.transition = 'border 3s ease';
        setTimeout(() => {
          element.style.border = '';
        }, 3000);
      }, 500);
    }
  };

  const validateFormWithNotification = (isDraft = false) => {
    if (isDraft) {
      // For drafts, we only need project ID to be valid
      if (!formData.projectId.trim()) {
        addNotification({
          type: 'warning',
          priority: 'medium',
          title: 'Form Incomplete',
          message: 'Please select a project to save the draft',
          moduleSource: 'qa',
          relatedId: projectId,
          actionable: true
        });
        focusFirstIncompleteField('projectId');
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

    // Find first incomplete field
    for (const { field, label } of requiredFields) {
      if (!formData[field as keyof typeof formData].trim()) {
        addNotification({
          type: 'warning',
          priority: 'medium',
          title: 'Form Incomplete',
          message: `Please complete the ${label} field`,
          moduleSource: 'qa',
          relatedId: projectId,
          actionable: true
        });
        focusFirstIncompleteField(field);
        return false;
      }
    }

    if (uploadingFiles) {
      addNotification({
        type: 'warning',
        priority: 'medium',
        title: 'Upload in Progress',
        message: 'Please wait for file uploads to complete',
        moduleSource: 'qa',
        relatedId: projectId,
        actionable: false
      });
      return false;
    }

    if (hasUploadFailures) {
      addNotification({
        type: 'warning',
        priority: 'high',
        title: 'Upload Failed',
        message: 'Some file uploads failed. Please retry or remove failed uploads',
        moduleSource: 'qa',
        relatedId: projectId,
        actionable: true
      });
      return false;
    }

    return true;
  };

  const isFormComplete = () => {
    const requiredFields = ['projectId', 'taskArea', 'building', 'inspectionType', 'template', 'inspectorName', 'inspectionDate', 'digitalSignature'];
    return requiredFields.every(field => formData[field as keyof typeof formData].trim() !== '');
  };

  const saveDraft = async () => {
    if (!validateFormWithNotification(true)) {
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
    if (!validateFormWithNotification()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Filter checklist based on fire door setting
      const filteredChecklist = checklist.filter(item => 
        !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
      );

      // Calculate automated overall status
      const formComplete = isFormComplete();
      const calculatedStatus = calculateOverallStatus(filteredChecklist, formComplete);

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
        overall_status: calculatedStatus
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
                disabled={saving || uploadingFiles}
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