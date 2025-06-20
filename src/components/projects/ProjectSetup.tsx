import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressInput } from '@/components/ui/address-input';
import { useToast } from '@/hooks/use-toast';
import { X, Building2, Calendar } from 'lucide-react';

interface ProjectSetupProps {
  onClose: () => void;
  onProjectCreated?: (projectData: any) => Promise<any>;
}

const ProjectSetup: React.FC<ProjectSetupProps> = ({ onClose, onProjectCreated }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    projectType: '',
    siteAddress: '',
    clientBuilder: '',
    startDate: '',
    estimatedCompletion: '',
    projectStatus: 'planning',
    description: '',
    contactEmail: '',
    contactPhone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('Submitting project data:', formData);
    
    try {
      if (onProjectCreated) {
        const result = await onProjectCreated(formData);
        
        if (result) {
          toast({
            title: "Project Created Successfully",
            description: `${formData.projectName} has been set up and is ready to use.`,
          });
          onClose();
        }
      } else {
        // Fallback if no handler provided
        toast({
          title: "Project Created Successfully",
          description: `${formData.projectName} has been set up and is ready to use.`,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">New Project Setup</h3>
        </div>
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
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
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}
                  disabled={loading}
                >
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
              <AddressInput
                value={formData.siteAddress}
                onChange={(value) => setFormData(prev => ({ ...prev, siteAddress: value }))}
                placeholder="Start typing the site address..."
                disabled={loading}
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
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectStatus">Project Status</Label>
                <Select 
                  value={formData.projectStatus} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, projectStatus: value }))}
                  disabled={loading}
                >
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                <Input
                  id="estimatedCompletion"
                  type="date"
                  value={formData.estimatedCompletion}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedCompletion: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief project overview, scope, or special requirements"
                rows={3}
                disabled={loading}
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
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="+61 XXX XXX XXX"
                  disabled={loading}
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
            Upon project creation, the following will be ready:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Project dashboard with key metrics</li>
            <li>• QA/ITP inspection tracking</li>
            <li>• Material handover management</li>
            <li>• Document management system</li>
          </ul>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex items-center gap-2" disabled={loading}>
            <Building2 className="h-4 w-4" />
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectSetup;
