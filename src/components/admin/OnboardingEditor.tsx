
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2 } from 'lucide-react';
type UserRole = 'project_manager' | 'estimator' | 'admin' | 'site_supervisor' | 'subcontractor' | 'client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  module: string;
  order: number;
}

const OnboardingEditor: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('project_manager');
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: '1',
      title: 'Welcome to Projects',
      description: 'Learn how to create and manage construction projects',
      module: 'projects',
      order: 1
    },
    {
      id: '2',
      title: 'Task Management',
      description: 'Assign and track project tasks efficiently',
      module: 'tasks',
      order: 2
    },
    {
      id: '3',
      title: 'RFI Handling',
      description: 'Submit and manage requests for information',
      module: 'rfis',
      order: 3
    }
  ]);

  const roles: { value: UserRole; label: string }[] = [
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'estimator', label: 'Estimator' },
    { value: 'admin', label: 'Admin/Project Engineer' },
    { value: 'site_supervisor', label: 'Site Supervisor' },
    { value: 'subcontractor', label: 'Subcontractor' },
    { value: 'client', label: 'Client/Builder' },
  ];

  const addStep = () => {
    const newStep: OnboardingStep = {
      id: Date.now().toString(),
      title: 'New Step',
      description: 'Step description',
      module: 'projects',
      order: steps.length + 1
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, field: keyof OnboardingStep, value: string | number) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  const deleteStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const saveOnboarding = () => {
    // In real implementation, save to database
    console.log('Saving onboarding for role:', selectedRole, steps);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Onboarding System Editor</CardTitle>
          <CardDescription>
            Customize role-specific onboarding flows and AI assistant guidance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Role to Edit</label>
              <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Onboarding Steps</CardTitle>
              <CardDescription>
                Configure the walkthrough steps for {roles.find(r => r.value === selectedRole)?.label}
              </CardDescription>
            </div>
            <Button onClick={addStep} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Step {index + 1}</Badge>
                  <Button 
                    onClick={() => deleteStep(step.id)} 
                    size="sm" 
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input 
                      value={step.title}
                      onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Module</label>
                    <Input 
                      value={step.module}
                      onChange={(e) => updateStep(step.id, 'module', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea 
                    value={step.description}
                    onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end mt-6">
            <Button onClick={saveOnboarding} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Onboarding Flow
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingEditor;
