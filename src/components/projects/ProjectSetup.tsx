
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { X, Building2, Calendar, MapPin } from 'lucide-react';

interface ProjectSetupProps {
  onClose: () => void;
  onProjectCreated?: (projectData: any) => void;
}

const ProjectSetup: React.FC<ProjectSetupProps> = ({ onClose, onProjectCreated }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    siteAddress: '',
    clientBuilder: '',
    startDate: '',
    estimatedCompletion: '',
    projectStatus: 'planning',
    description: '',
    projectManager: '',
    contactEmail: '',
    contactPhone: ''
  });

  // Auto-generate project ID
  React.useEffect(() => {
    const generateProjectId = () => {
      const date = new Date();
      const id = `PRJ-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      setFormData(prev => ({ ...prev, projectId: id }));
    };
    generateProjectId();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Project Setup:', formData);
    
    toast({
      title: "Project Created Successfully",
      description: `${formData.projectName} has been set up. Cloud storage folders will be created automatically.`,
    });

    onProjectCreated?.(formData);
    onClose();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">New Project Setup</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="e.g. Riverside Apartments Development"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="mixed-use">Mixed-use</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteAddress">Site Address</Label>
              <Textarea
                id="siteAddress"
                value={formData.siteAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, siteAddress: e.target.value }))}
                placeholder="Full site address including postcode"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientBuilder">Client / Builder</Label>
                <Input
                  id="clientBuilder"
                  value={formData.clientBuilder}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientBuilder: e.target.value }))}
                  placeholder="e.g. ABC Construction Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectManager">Project Manager</Label>
                <Input
                  id="projectManager"
                  value={formData.projectManager}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectManager: e.target.value }))}
                  placeholder="Assigned PM name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                <Input
                  id="estimatedCompletion"
                  type="date"
                  value={formData.estimatedCompletion}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedCompletion: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectStatus">Project Status</Label>
              <Select value={formData.projectStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, projectStatus: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">🟡 Planning</SelectItem>
                  <SelectItem value="in-progress">🟢 In Progress</SelectItem>
                  <SelectItem value="paused">🟠 Paused</SelectItem>
                  <SelectItem value="complete">✅ Complete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief project overview, scope, or special requirements"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Primary Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="project.manager@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+61 XXX XXX XXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Automatic Setup
          </h4>
          <p className="text-sm text-blue-800">
            Upon project creation, the following will be automatically set up:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Cloud storage folders (/Drawings, /Specifications, /Contracts, /Safety Docs, /Site Photos)</li>
            <li>• Project dashboard with key metrics</li>
            <li>• Initial programme milestones</li>
            <li>• Document checklist</li>
          </ul>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Create Project
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectSetup;
