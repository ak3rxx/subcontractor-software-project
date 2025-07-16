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
import { useEnhancedQANotifications } from '@/hooks/useEnhancedQANotifications';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';
import { useQAUploadManager } from '@/hooks/useQAUploadManager';
import { QAStatusBar } from './QAStatusBar';
import { calculateOverallStatus } from '@/utils/qaStatusCalculation';
import EnhancedNotificationTooltip from '@/components/notifications/EnhancedNotificationTooltip';
import EnhancedFileUpload from './EnhancedFileUpload';
import QAFormValidation from './QAFormValidation';
import QAContextualHelp from './QAContextualHelp';
import QAProcessGuide from './QAProcessGuide';
import QAErrorRecovery from './QAErrorRecovery';
import QAOnboardingTour from './QAOnboardingTour';
import { useQAErrorTracking } from '@/hooks/useQAErrorTracking';

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
  const qaNotifications = useEnhancedQANotifications();
  
  // Coordinate data updates with other components
  useQAInspectionCoordination(refetchProjects);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardingTour, setShowOnboardingTour] = useState(false);
  
  // Enhanced error tracking
  const errorTracking = useQAErrorTracking();

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

  // Enhanced upload management
  const uploadManager = useQAUploadManager({
    folder: `inspections/${formData.projectId || 'temp'}`
  });

  // Auto-save functionality with enhanced persistence
  const autoSave = useFormAutoSave(
    { ...formData, checklist }, 
    {
      key: `qa-form-${projectId || 'new'}`,
      interval: 30000, // Save every 30 seconds
      onSave: (data) => {
        qaNotifications.notifyAutoSave(Object.keys(data).length);
      },
      onRestore: (data) => {
        setFormData(data.formData || data);
        if (data.checklist) {
          setChecklist(data.checklist);
        }
        qaNotifications.notifyFormMilestone('Draft Restored', 'Previous work restored from auto-save');
      }
    }
  );

  // Initialize checklist when template changes
  useEffect(() => {
    const templateChecklist = templates[formData.template as keyof typeof templates]?.items || [];
    setChecklist(templateChecklist.map(item => ({
      ...item,
      status: undefined,
      comments: '',
      evidenceFiles: []
    })));
    
    // Show template-specific help
    qaNotifications.notifyTemplateHelp(formData.template);
  }, [formData.template, qaNotifications]);

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-fill project name when project is selected
      if (field === 'projectId' && value) {
        const selectedProject = projects.find(p => p.id === value);
        if (selectedProject) {
          updated.projectName = selectedProject.name;
          // Celebrate milestone
          qaNotifications.notifyFormMilestone('Project Selected', `Working on "${selectedProject.name}"`);
        }
      }
      
      // Check for important field completions
      if (field === 'inspectorName' && value) {
        qaNotifications.notifyFormMilestone('Inspector Set', `Inspector: ${value}`);
      }
      
      if (field === 'taskArea' && value) {
        qaNotifications.notifyFormMilestone('Task Area Defined', `Area: ${value}`);
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

  const handleFileUpload = async (files: FileList, itemId: string) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      try {
        await uploadManager.queueFiles([file]);
        qaNotifications.notifyUploadProgress(file.name, 100, 100);
      } catch (error) {
        qaNotifications.notifyRecoveryAction(
          'Upload Failed',
          [`Failed to upload ${file.name}`, 'Check file size and type', 'Retry upload', 'Continue without this file']
        );
      }
    }
  };

  const handleUploadStatusChange = (isUploading: boolean, hasFailures: boolean) => {
    // Legacy handler for compatibility
  };

  // Get missing form fields for better user feedback
  const getMissingFormFields = (): string[] => {
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

    return requiredFields
      .filter(({ field }) => !formData[field as keyof typeof formData]?.toString().trim())
      .map(({ label }) => label);
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
        qaNotifications.notifyFieldValidation('Project', false, 'Please select a project to save the draft');
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
        qaNotifications.notifyFieldValidation(label, false, `Please complete the ${label} field`);
        focusFirstIncompleteField(field);
        return false;
      }
    }

    if (uploadManager.isProcessing) {
      qaNotifications.notifyProcessStage(
        'Upload in Progress',
        'Please wait for file uploads to complete before submitting the inspection'
      );
      return false;
    }

    if (uploadManager.failedFiles.length > 0) {
      qaNotifications.notifyRecoveryAction(
        'Upload Failed',
        ['Some file uploads failed', 'Retry failed uploads', 'Remove failed files', 'Submit without failed files']
      );
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
        const message = isFormComplete() ? 
          "Complete inspection saved successfully. View it in the QA/ITP List tab." : 
          "Incomplete draft saved. You can continue editing it in the QA/ITP List tab.";
        toast({
          title: "Draft Saved",
          description: message
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
          description: "QA inspection created successfully. View it in the QA/ITP List tab."
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
      <EnhancedNotificationTooltip />
      
      {/* Onboarding Tour */}
      <QAOnboardingTour
        isVisible={showOnboardingTour}
        userRole="beginner" // TODO: Get from user context
        onComplete={() => setShowOnboardingTour(false)}
        onSkip={() => setShowOnboardingTour(false)}
        onStepComplete={(step) => console.log('Step completed:', step)}
      />
      
      {/* Process Guide */}
      <QAProcessGuide
        formData={formData}
        checklist={filteredChecklist}
        onStageAction={(stage, action) => {
          console.log('Stage action:', stage, action);
          // TODO: Implement stage navigation
        }}
      />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle>
                Create New QA Inspection
              </CardTitle>
              <QAContextualHelp
                fieldName="inspection_title"
                templateType={formData.template}
                currentValue={formData.taskArea}
                validationErrors={error ? [error] : []}
                isRequired={true}
                onHelpAction={(action) => console.log('Help action:', action)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowOnboardingTour(true)}
                variant="ghost"
                size="sm"
              >
                Show Tour
              </Button>
              <Button 
                onClick={saveDraft}
                disabled={saving || uploadManager.isProcessing}
                variant={isFormComplete() ? "default" : "secondary"}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                onClick={onClose}
                disabled={saving || uploadManager.isProcessing}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Recovery Component */}
          {(error || uploadManager.failedFiles.length > 0) && (
            <QAErrorRecovery
              errors={[
                ...(error ? [{
                  id: 'form-error',
                  type: 'validation' as const,
                  severity: 'high' as const,
                  message: error,
                  details: 'Form validation error occurred'
                }] : []),
                ...uploadManager.failedFiles.map(file => ({
                  id: file.id,
                  type: 'upload' as const,
                  severity: 'medium' as const,
                  message: `Upload failed for ${file.name}`,
                  details: file.error || 'Unknown upload error'
                }))
              ]}
              onErrorResolved={(errorId) => {
                if (errorId === 'form-error') {
                  setError(null);
                }
              }}
              onRetry={async (context) => {
                if (context.type === 'upload') {
                  uploadManager.retryUpload(context.id);
                  return true;
                } else if (context.type === 'form') {
                  try {
                    await handleSubmit();
                    return true;
                  } catch {
                    return false;
                  }
                }
                return false;
              }}
              onEscalate={(errorId, details) => {
                console.log('Escalating error:', errorId, details);
                // TODO: Implement escalation system
              }}
            />
          )}

          <QAStatusBar 
            checklist={filteredChecklist}
            isFormComplete={isFormComplete()}
            missingFormFields={getMissingFormFields()}
          />

          <QAITPProjectInfo
            formData={formData}
            isFireDoor={isFireDoor}
            projects={projects}
            onFormDataChange={handleFormDataChange}
            onFireDoorChange={setIsFireDoor}
            onTemplateChange={handleTemplateChange}
          />

          {checklist.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">Inspection Checklist</h3>
                <QAContextualHelp
                  fieldName="checklist_items"
                  templateType={formData.template}
                  currentValue={filteredChecklist.length.toString()}
                  validationErrors={[]}
                  isRequired={true}
                  onHelpAction={(action) => console.log('Checklist help action:', action)}
                />
              </div>
              <div className="space-y-3">
                {filteredChecklist.map((item, index) => (
                  <div key={item.id} className="relative">
                    <QAITPChecklistItem
                      item={item}
                      onChecklistChange={handleChecklistChange}
                      onUploadStatusChange={handleUploadStatusChange}
                      inspectionId={null}
                    />
                    <div className="absolute -right-8 top-2">
                      <QAContextualHelp
                        fieldName="checklist_item"
                        templateType={formData.template}
                        currentValue={item.status || ''}
                        validationErrors={[]}
                        isRequired={true}
                        onHelpAction={(action) => console.log('Item help action:', action)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <QAITPSignOff
              formData={formData}
              onFormDataChange={handleFormDataChange}
              calculatedStatus={calculateOverallStatus(filteredChecklist, isFormComplete())}
            />
            <QAContextualHelp
              fieldName="digital_signature"
              templateType={formData.template}
              currentValue={formData.digitalSignature}
              validationErrors={error && formData.digitalSignature === '' ? [error] : []}
              isRequired={true}
              onHelpAction={(action) => console.log('Signature help action:', action)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              onClick={saveDraft}
              disabled={saving || uploadManager.isProcessing}
              variant="outline"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saving || uploadManager.isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? 'Submitting...' : 'Submit Inspection'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QAITPForm;