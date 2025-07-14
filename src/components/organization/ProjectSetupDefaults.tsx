
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Folder } from 'lucide-react';

interface DefaultFolder {
  id: string;
  name: string;
  description: string;
  required: boolean;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  folders: string[];
  checklists: string[];
}

interface ProjectSetupDefaultsProps {
  organizationId?: string;
}

const ProjectSetupDefaults: React.FC<ProjectSetupDefaultsProps> = ({ organizationId }) => {
  const [defaultFolders, setDefaultFolders] = useState<DefaultFolder[]>([
    { id: '1', name: 'Drawings', description: 'Architectural and engineering drawings', required: true },
    { id: '2', name: 'Specifications', description: 'Technical specifications and requirements', required: true },
    { id: '3', name: 'Contracts', description: 'Contract documents and agreements', required: true },
    { id: '4', name: 'Safety', description: 'SWMS and safety documentation', required: true },
    { id: '5', name: 'Scope of Works', description: 'Detailed scope documentation', required: true },
    { id: '6', name: 'Correspondence', description: 'Project communication', required: false },
    { id: '7', name: 'Photos', description: 'Site progress photos', required: false },
  ]);

  const [templates, setTemplates] = useState<ProjectTemplate[]>([
    {
      id: '1',
      name: 'Commercial Build',
      description: 'Standard commercial construction project',
      folders: ['Drawings', 'Specifications', 'Contracts', 'Safety', 'Scope of Works'],
      checklists: ['Design Review', 'Permits', 'Contractor Selection']
    },
    {
      id: '2',
      name: 'Residential Build',
      description: 'Single/multi-family residential project',
      folders: ['Drawings', 'Specifications', 'Contracts', 'Safety'],
      checklists: ['Design Review', 'Council Approvals', 'Contractor Licensing']
    }
  ]);

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  const addFolder = () => {
    if (newFolderName.trim()) {
      const newFolder: DefaultFolder = {
        id: Date.now().toString(),
        name: newFolderName.trim(),
        description: newFolderDescription.trim(),
        required: false
      };
      setDefaultFolders([...defaultFolders, newFolder]);
      setNewFolderName('');
      setNewFolderDescription('');
    }
  };

  const removeFolder = (id: string) => {
    setDefaultFolders(defaultFolders.filter(f => f.id !== id));
  };

  const toggleRequired = (id: string) => {
    setDefaultFolders(defaultFolders.map(f => 
      f.id === id ? { ...f, required: !f.required } : f
    ));
  };

  const saveDefaults = () => {
    // In real implementation, save to database
    console.log('Saving project defaults:', { defaultFolders, templates });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Project Folders</CardTitle>
          <CardDescription>
            Configure the folder structure that will be created for every new project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {defaultFolders.map((folder) => (
              <div key={folder.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Folder className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {folder.name}
                      {folder.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                    </div>
                    <div className="text-sm text-gray-600">{folder.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={folder.required}
                      onCheckedChange={() => toggleRequired(folder.id)}
                    />
                    <span className="text-sm text-gray-600">Required</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFolder(folder.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="text-sm font-medium">Add New Folder</div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Input
                placeholder="Description"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
              />
            </div>
            <Button onClick={addFolder} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Folder
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Templates</CardTitle>
          <CardDescription>
            Pre-configured project setups for different types of construction projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border rounded-lg p-4">
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-600 mb-3">{template.description}</div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">FOLDERS:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.folders.map((folder) => (
                        <Badge key={folder} variant="outline" className="text-xs">
                          {folder}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">CHECKLISTS:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.checklists.map((checklist) => (
                        <Badge key={checklist} variant="secondary" className="text-xs">
                          {checklist}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveDefaults} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Defaults
        </Button>
      </div>
    </div>
  );
};

export default ProjectSetupDefaults;
