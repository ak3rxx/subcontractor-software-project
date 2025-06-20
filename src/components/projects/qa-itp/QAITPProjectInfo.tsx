
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Project } from '@/hooks/useProjects';

interface QAITPProjectInfoProps {
  formData: {
    projectId: string;
    projectName: string;
    taskArea: string;
    locationReference: string;
    inspectionType: string;
    template: string;
  };
  isFireDoor: boolean;
  projects: Project[];
  onFormDataChange: (field: string, value: string) => void;
  onFireDoorChange: (checked: boolean) => void;
  onTemplateChange: (templateKey: string) => void;
}

const QAITPProjectInfo: React.FC<QAITPProjectInfoProps> = ({
  formData,
  isFireDoor,
  projects,
  onFormDataChange,
  onFireDoorChange,
  onTemplateChange
}) => {
  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    onFormDataChange('projectId', projectId);
    if (selectedProject) {
      onFormDataChange('projectName', selectedProject.name);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project & Task Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <Select value={formData.projectId} onValueChange={handleProjectChange}>
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
          <div className="space-y-2">
            <Label htmlFor="taskArea">Task/Area being inspected</Label>
            <Input
              id="taskArea"
              placeholder="e.g. Framing, Waterproofing"
              value={formData.taskArea}
              onChange={(e) => onFormDataChange('taskArea', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationReference">Location/Grid Reference</Label>
            <Input
              id="locationReference"
              value={formData.locationReference}
              onChange={(e) => onFormDataChange('locationReference', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inspectionType">Inspection Type</Label>
            <Select value={formData.inspectionType} onValueChange={(value) => onFormDataChange('inspectionType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select inspection type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="post-installation">Post-installation</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">ITP Template</Label>
          <Select value={formData.template} onValueChange={onTemplateChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select inspection template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="doors-jambs-hardware">Doors, Door jambs & Door hardware</SelectItem>
              <SelectItem value="skirting">Skirting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fire Door Checkbox - only show for doors template */}
        {formData.template === 'doors-jambs-hardware' && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFireDoor"
              checked={isFireDoor}
              onCheckedChange={(checked) => onFireDoorChange(checked as boolean)}
            />
            <Label htmlFor="isFireDoor">This is a Fire Door installation</Label>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QAITPProjectInfo;
