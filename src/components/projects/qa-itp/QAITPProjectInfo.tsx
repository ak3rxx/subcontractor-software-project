
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Project } from '@/hooks/useProjects';
import SmartTradeSelector from '@/components/projects/variations/SmartTradeSelector';
import { templates, tradeTemplateMapping } from './QAITPTemplates';
import { useOrganizations } from '@/hooks/useOrganizations';

interface QAITPProjectInfoProps {
  formData: {
    projectId: string;
    projectName: string;
    taskArea: string;
    building: string;
    level: string;
    buildingReference: string;
    inspectionType: string;
    template: string;
    trade: string;
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
  const { organizations } = useOrganizations();
  
  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    onFormDataChange('projectId', projectId);
    if (selectedProject) {
      onFormDataChange('projectName', selectedProject.name);
    }
  };

  const handleTradeChange = (trade: string) => {
    onFormDataChange('trade', trade);
    // Reset template when trade changes
    const availableTemplates = tradeTemplateMapping[trade] || [];
    if (availableTemplates.length > 0 && !availableTemplates.includes(formData.template)) {
      onTemplateChange(availableTemplates[0]);
    }
  };

  // Filter templates based on selected trade
  const availableTemplates = tradeTemplateMapping[formData.trade] || [];
  const organizationId = organizations?.[0]?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project & Task Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qa-project-select">Project (Auto-selected)</Label>
              <div id="qa-project-select" className="p-2 bg-gray-50 border rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" tabIndex={0}>
                {projects.find(p => p.id === formData.projectId)?.name || 'No project selected'}
              </div>
              <p className="text-xs text-muted-foreground">Project is automatically selected from your current location</p>
            </div>
          <div className="space-y-2">
            <Label htmlFor="qa-task-area">Task/Area being inspected</Label>
            <Input
              id="qa-task-area"
              placeholder="e.g. Framing, Waterproofing"
              value={formData.taskArea}
              onChange={(e) => onFormDataChange('taskArea', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="qa-building">Building</Label>
            <Input
              id="qa-building"
              placeholder="e.g. Building A, Tower 1"
              value={formData.building}
              onChange={(e) => onFormDataChange('building', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              placeholder="e.g. Ground, Level 5"
              value={formData.level}
              onChange={(e) => onFormDataChange('level', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buildingReference">Location Reference (Optional)</Label>
            <Input
              id="buildingReference"
              placeholder="e.g. Grid A1-B2, Room 101"
              value={formData.buildingReference}
              onChange={(e) => onFormDataChange('buildingReference', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qa-inspection-type">Inspection Type</Label>
          <Select value={formData.inspectionType} onValueChange={(value) => onFormDataChange('inspectionType', value)}>
            <SelectTrigger id="qa-inspection-type">
              <SelectValue placeholder="Select inspection type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-installation">Pre-installation</SelectItem>
              <SelectItem value="final">Final</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SmartTradeSelector
          value={formData.trade}
          onChange={handleTradeChange}
          description={formData.taskArea}
          organizationId={organizationId}
          showAISuggestion={true}
        />

        <div className="space-y-2">
          <Label htmlFor="qa-template">ITP Template</Label>
          {availableTemplates.length > 0 ? (
            <Select value={formData.template} onValueChange={onTemplateChange}>
              <SelectTrigger id="qa-template">
                <SelectValue placeholder="Select inspection template" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((templateKey) => {
                  const template = templates[templateKey as keyof typeof templates];
                  return (
                    <SelectItem key={templateKey} value={templateKey}>
                      {template?.name || templateKey}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 bg-gray-50 border rounded-md text-gray-500 text-sm">
              No templates available for selected trade
            </div>
          )}
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
