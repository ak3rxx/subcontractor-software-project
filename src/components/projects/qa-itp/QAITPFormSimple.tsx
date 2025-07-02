import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/hooks/useProjects';
import { ChecklistItem, templates } from './QAITPTemplates';
import QAITPChecklistItemEnhanced from './QAITPChecklistItemEnhanced';
import { AlertCircle, Save, X } from 'lucide-react';

interface QAITPFormSimpleProps {
  onClose: () => void;
  projectId?: string;
  editingInspection?: any;
}

const QAITPFormSimple: React.FC<QAITPFormSimpleProps> = ({ 
  onClose, 
  projectId,
  editingInspection 
}) => {
  const { createInspection, updateInspection } = useQAInspectionsSimple();
  const { toast } = useToast();
  const { projects } = useProjects();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified form state
  const [formData, setFormData] = useState({
    projectId: projectId || '',
    projectName: '',
    taskArea: '',
    building: '',
    level: '',
    buildingReference: '',
    inspectionType: 'post-installation' as const,
    template: 'doors-jambs-hardware' as const,
    inspectorName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    digitalSignature: '',
    overallStatus: 'incomplete-in-progress' as const
  });

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isFireDoor, setIsFireDoor] = useState(false);

  // Initialize checklist when template changes
  useEffect(() => {
    const templateChecklist = templates[formData.template]?.items || [];
    setChecklist(templateChecklist.map(item => ({
      ...item,
      status: undefined,
      comments: '',
      evidenceFiles: []
    })));
  }, [formData.template]);

  // Populate form if editing
  useEffect(() => {
    if (editingInspection) {
      setFormData({
        projectId: editingInspection.project_id,
        projectName: editingInspection.project_name,
        taskArea: editingInspection.task_area,
        building: editingInspection.location_reference?.split(' - ')[0] || '',
        level: editingInspection.location_reference?.split(' - ')[1]?.replace('Level ', '') || '',
        buildingReference: editingInspection.location_reference?.split(' - ')[2] || '',
        inspectionType: editingInspection.inspection_type,
        template: editingInspection.template_type,
        inspectorName: editingInspection.inspector_name,
        inspectionDate: editingInspection.inspection_date,
        digitalSignature: editingInspection.digital_signature,
        overallStatus: editingInspection.overall_status
      });
      setIsFireDoor(editingInspection.is_fire_door);
    }
  }, [editingInspection]);

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

  const handleChecklistChange = (itemId: string, field: string, value: any) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const validateForm = () => {
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
      if (!formData[field as keyof typeof formData]?.toString().trim()) {
        setError(`${label} is required`);
        return false;
      }
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

      // Transform data to database format
      const inspectionData = {
        project_id: formData.projectId,
        project_name: formData.projectName,
        task_area: formData.taskArea,
        location_reference: locationReference,
        inspection_type: formData.inspectionType,
        template_type: formData.template,
        is_fire_door: isFireDoor,
        inspector_name: formData.inspectorName,
        inspection_date: formData.inspectionDate,
        digital_signature: formData.digitalSignature,
        overall_status: formData.overallStatus
      };

      const checklistItems = filteredChecklist.map(item => ({
        item_id: item.id,
        description: item.description,
        requirements: item.requirements,
        status: item.status || '',
        comments: item.comments || '',
        evidence_files: [] // Simplified for now - no file uploads
      }));

      let result;
      if (editingInspection) {
        result = await updateInspection(editingInspection.id, inspectionData, checklistItems);
      } else {
        result = await createInspection(inspectionData, checklistItems);
      }

      if (result) {
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

  const filteredChecklist = checklist.filter(item => 
    !item.isFireDoorOnly || (item.isFireDoorOnly && isFireDoor)
  );

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

          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project">Project *</Label>
              <Select value={formData.projectId} onValueChange={(value) => handleFormDataChange('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="taskArea">Task Area *</Label>
              <Input
                id="taskArea"
                value={formData.taskArea}
                onChange={(e) => handleFormDataChange('taskArea', e.target.value)}
                placeholder="e.g., Apartment 101"
              />
            </div>

            <div>
              <Label htmlFor="building">Building *</Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => handleFormDataChange('building', e.target.value)}
                placeholder="e.g., Building A"
              />
            </div>

            <div>
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                value={formData.level}
                onChange={(e) => handleFormDataChange('level', e.target.value)}
                placeholder="e.g., 1"
              />
            </div>

            <div>
              <Label htmlFor="inspectionType">Inspection Type *</Label>
              <Select value={formData.inspectionType} onValueChange={(value) => handleFormDataChange('inspectionType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post-installation">Post Installation</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template">Template *</Label>
              <Select value={formData.template} onValueChange={(value) => handleFormDataChange('template', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doors-jambs-hardware">Doors, Jambs & Hardware</SelectItem>
                  <SelectItem value="skirting">Skirting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="inspectorName">Inspector Name *</Label>
              <Input
                id="inspectorName"
                value={formData.inspectorName}
                onChange={(e) => handleFormDataChange('inspectorName', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="inspectionDate">Inspection Date *</Label>
              <Input
                id="inspectionDate"
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => handleFormDataChange('inspectionDate', e.target.value)}
              />
            </div>
          </div>

          {/* Fire Door Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFireDoor"
              checked={isFireDoor}
              onChange={(e) => setIsFireDoor(e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isFireDoor">Fire Door Inspection</Label>
          </div>

          {/* Enhanced Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inspection Checklist</h3>
            <p className="text-sm text-muted-foreground">
              Select one status option for each item. Changes are automatically tracked with audit trail.
            </p>
            {filteredChecklist.map((item) => (
              <QAITPChecklistItemEnhanced
                key={item.id}
                item={item}
                onChecklistChange={handleChecklistChange}
                inspectionId={editingInspection?.id || null}
                showAuditTrail={!!editingInspection}
              />
            ))}
          </div>

          {/* Digital Signature */}
          <div>
            <Label htmlFor="digitalSignature">Digital Signature *</Label>
            <Input
              id="digitalSignature"
              value={formData.digitalSignature}
              onChange={(e) => handleFormDataChange('digitalSignature', e.target.value)}
              placeholder="Enter inspector signature"
            />
          </div>

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
              disabled={saving}
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

export default QAITPFormSimple;