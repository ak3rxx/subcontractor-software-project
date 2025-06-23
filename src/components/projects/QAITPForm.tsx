
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X, AlertCircle } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useQAInspections } from '@/hooks/useQAInspections';
import QAITPProjectInfo from './qa-itp/QAITPProjectInfo';
import QAITPChecklistItem from './qa-itp/QAITPChecklistItem';
import QAITPSignOff from './qa-itp/QAITPSignOff';
import { templates, type ChecklistItem } from './qa-itp/QAITPTemplates';

interface QAITPFormProps {
  onClose: () => void;
}

const QAITPForm: React.FC<QAITPFormProps> = ({ onClose }) => {
  const { toast } = useToast();
  const { projects } = useProjects();
  const { createInspection } = useQAInspections();
  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    taskArea: '',
    building: '',
    level: '',
    buildingReference: '',
    inspectionType: '',
    template: '',
    inspectorName: '',
    inspectionDate: '',
    digitalSignature: '',
    overallStatus: ''
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isFireDoor, setIsFireDoor] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasUploadFailures, setHasUploadFailures] = useState(false);

  const handleFormDataChange = (field: string, value: string) => {
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
  };

  const handleTemplateChange = (templateKey: string) => {
    setFormData(prev => ({ ...prev, template: templateKey }));
    if (templateKey && templates[templateKey as keyof typeof templates]) {
      setChecklist(templates[templateKey as keyof typeof templates].items);
    } else {
      setChecklist([]);
    }
  };

  const handleChecklistChange = (id: string, field: string, value: any) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleUploadStatusChange = (isUploading: boolean, hasFailures: boolean) => {
    setUploading(isUploading);
    setHasUploadFailures(hasFailures);
  };

  const checkForIncompleteItems = () => {
    const filteredChecklist = checklist.filter(item => 
      !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
    );

    const incompleteItems = filteredChecklist.filter(item => 
      !item.status || item.status === undefined || item.status === null
    );

    return incompleteItems;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for all files to finish uploading before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (hasUploadFailures) {
      toast({
        title: "Upload Failures Detected",
        description: "Please retry failed uploads or remove failed files before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.digitalSignature.trim()) {
      toast({
        title: "Digital Signature Required",
        description: "Please provide your digital signature before submitting.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.projectId) {
      toast({
        title: "Project Required",
        description: "Please select a project for this inspection.",
        variant: "destructive"
      });
      return;
    }

    // Check for incomplete items
    const incompleteItems = checkForIncompleteItems();
    if (incompleteItems.length > 0) {
      toast({
        title: "Incomplete Items Found",
        description: `${incompleteItems.length} checklist items are not checked. The inspection will be marked as incomplete.`,
        variant: "destructive"
      });
      
      // Auto-set status to incomplete if there are unchecked items
      setFormData(prev => ({ ...prev, overallStatus: 'incomplete-in-progress' }));
    }

    setSubmitting(true);

    try {
      const filteredChecklist = checklist.filter(item => 
        !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
      );

      // Combine building, level, and building reference for location_reference
      // Building reference is optional now
      const locationParts = [formData.building, formData.level];
      if (formData.buildingReference.trim()) {
        locationParts.push(formData.buildingReference);
      }
      const locationReference = locationParts.join(' - ');

      const inspectionData = {
        project_id: formData.projectId,
        project_name: formData.projectName,
        task_area: formData.taskArea,
        location_reference: locationReference,
        inspection_type: formData.inspectionType as 'post-installation' | 'final' | 'progress',
        template_type: formData.template as 'doors-jambs-hardware' | 'skirting',
        is_fire_door: isFireDoor,
        inspector_name: formData.inspectorName,
        inspection_date: formData.inspectionDate,
        digital_signature: formData.digitalSignature,
        overall_status: formData.overallStatus as 'pass' | 'fail' | 'pending-reinspection' | 'incomplete-in-progress'
      };

      const checklistItemsData = filteredChecklist.map(item => ({
        item_id: item.id,
        description: item.description,
        requirements: item.requirements,
        status: item.status,
        comments: item.comments || null,
        evidence_files: null
      }));

      const result = await createInspection(inspectionData, checklistItemsData);
      
      if (result) {
        toast({
          title: "QA Inspection Created",
          description: `Inspection ${result.inspection_number} has been created successfully.`,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredChecklist = checklist.filter(item => 
    !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">New QA/ITP Inspection</h3>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <QAITPProjectInfo
          formData={formData}
          isFireDoor={isFireDoor}
          projects={projects}
          onFormDataChange={handleFormDataChange}
          onFireDoorChange={setIsFireDoor}
          onTemplateChange={handleTemplateChange}
        />

        {/* Inspection Checklist */}
        {filteredChecklist.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inspection Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredChecklist.map((item) => (
                <QAITPChecklistItem
                  key={item.id}
                  item={item}
                  onChecklistChange={handleChecklistChange}
                  onUploadStatusChange={handleUploadStatusChange}
                />
              ))}
            </CardContent>
          </Card>
        )}

        <QAITPSignOff
          formData={formData}
          onFormDataChange={handleFormDataChange}
        />

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={submitting || uploading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={submitting || uploading || hasUploadFailures}
          >
            {submitting ? 'Creating...' : 
             uploading ? 'Uploading...' : 
             hasUploadFailures ? 'Fix Upload Errors' : 
             'Submit QA Inspection'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QAITPForm;
