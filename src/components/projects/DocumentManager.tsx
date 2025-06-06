
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FolderOpen, ExternalLink, Plus, CheckCircle2, AlertCircle, 
  FileText, Image, Video, Download 
} from 'lucide-react';

interface DocumentManagerProps {
  projectName: string;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ projectName }) => {
  const { toast } = useToast();
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ name: '', description: '' });

  // Sample document sections with cloud links
  const documentSections = [
    {
      name: 'Drawings',
      description: 'Architectural, structural, and MEP drawings',
      link: 'https://drive.google.com/drive/folders/drawings',
      status: 'complete',
      lastUpdated: '2024-01-10',
      fileCount: 24
    },
    {
      name: 'Specifications',
      description: 'Technical specifications and standards',
      link: 'https://dropbox.com/sh/specs',
      status: 'complete',
      lastUpdated: '2024-01-08',
      fileCount: 12
    },
    {
      name: 'Safety Documents',
      description: 'SWMS, safety procedures, and compliance docs',
      link: 'https://onedrive.live.com/safety',
      status: 'pending',
      lastUpdated: '2024-01-05',
      fileCount: 8
    },
    {
      name: 'Contracts',
      description: 'Main contract, subcontractor agreements',
      link: 'https://drive.google.com/drive/folders/contracts',
      status: 'complete',
      lastUpdated: '2024-01-12',
      fileCount: 6
    },
    {
      name: 'Scope of Works',
      description: 'Detailed scope documents and work packages',
      link: 'https://drive.google.com/drive/folders/scope',
      status: 'incomplete',
      lastUpdated: '2024-01-03',
      fileCount: 4
    },
    {
      name: 'Site Photos',
      description: 'Progress photos and documentation images',
      link: 'https://photos.google.com/share/site-photos',
      status: 'complete',
      lastUpdated: '2024-01-15',
      fileCount: 156
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">✅ Complete</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ Pending</Badge>;
      case 'incomplete':
        return <Badge className="bg-red-100 text-red-800">❌ Incomplete</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getFileIcon = (sectionName: string) => {
    if (sectionName.toLowerCase().includes('photo')) return <Image className="h-5 w-5" />;
    if (sectionName.toLowerCase().includes('video')) return <Video className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('New Document Section:', newSection);
    
    toast({
      title: "Document Section Added",
      description: `${newSection.name} section has been created. Cloud folder will be set up automatically.`,
    });

    setNewSection({ name: '', description: '' });
    setShowAddSection(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Document Manager</h3>
          <p className="text-gray-600">Manage project documentation and cloud storage links</p>
        </div>
        <Button onClick={() => setShowAddSection(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      {/* Document Checklist Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Document Checklist Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documentSections.filter(s => s.status === 'complete').length}
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {documentSections.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {documentSections.filter(s => s.status === 'incomplete').length}
              </div>
              <div className="text-sm text-gray-600">Incomplete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {documentSections.reduce((total, section) => total + section.fileCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Files</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Section Form */}
      {showAddSection && (
        <Card>
          <CardHeader>
            <CardTitle>Add Document Section</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSection} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sectionName">Section Name</Label>
                  <Input
                    id="sectionName"
                    value={newSection.name}
                    onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Engineering Reports"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newSection.description}
                    onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of document type"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button type="submit">Add Section</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddSection(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Document Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentSections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">{section.name}</CardTitle>
                </div>
                {getStatusBadge(section.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{section.description}</p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    {getFileIcon(section.name)}
                    {section.fileCount} files
                  </span>
                  <span className="text-gray-500">
                    Updated: {section.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => window.open(section.link, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Folder
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {section.status === 'incomplete' && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">Missing required documents</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cloud Storage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Cloud Storage Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Automatic Folder Creation</h4>
            <p className="text-sm text-blue-800 mb-3">
              When you create a new project, folders are automatically created in your connected cloud storage with the following structure:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• /{projectName}/Drawings</li>
              <li>• /{projectName}/Specifications</li>
              <li>• /{projectName}/Contracts</li>
              <li>• /{projectName}/Safety Documents</li>
              <li>• /{projectName}/Site Photos</li>
              <li>• /{projectName}/Scope of Works</li>
            </ul>
            <p className="text-xs text-blue-600 mt-3">
              Note: This requires Zapier integration to be set up with your cloud storage provider.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManager;
