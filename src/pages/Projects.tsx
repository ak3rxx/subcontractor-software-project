
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Package, Building2, Calendar } from 'lucide-react';
import QAITPForm from '@/components/projects/QAITPForm';
import QAITPTracker from '@/components/projects/QAITPTracker';
import MaterialHandover from '@/components/projects/MaterialHandover';
import ProjectSetup from '@/components/projects/ProjectSetup';
import ProjectDashboard from '@/components/projects/ProjectDashboard';

const Projects = () => {
  const [activeQAForm, setActiveQAForm] = useState(false);
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Sample projects data
  const projects = [
    {
      id: 'PRJ-001',
      projectName: 'Riverside Apartments Development',
      projectType: 'Residential',
      status: 'in-progress',
      completion: 65,
      startDate: '2024-01-15',
      estimatedCompletion: '2024-08-30',
      siteAddress: '123 River Street, Brisbane QLD 4000',
      projectManager: 'Sarah Johnson'
    },
    {
      id: 'PRJ-002',
      projectName: 'Commercial Plaza Fitout',
      projectType: 'Commercial',
      status: 'planning',
      completion: 15,
      startDate: '2024-02-01',
      estimatedCompletion: '2024-06-15',
      siteAddress: '456 Business Ave, Sydney NSW 2000',
      projectManager: 'Mike Davis'
    }
  ];

  const handleProjectCreated = (projectData: any) => {
    setSelectedProject(projectData);
    setActiveTab('overview');
  };

  if (selectedProject) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedProject(null)}
            >
              ← Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedProject.projectName}</h1>
              <p className="text-muted-foreground">Project Management Dashboard</p>
            </div>
          </div>
        </div>

        <ProjectDashboard projectData={selectedProject} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects Management</h1>
          <p className="text-muted-foreground">Manage projects, quality assurance, and material handovers</p>
        </div>
        <Button onClick={() => setShowProjectSetup(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {showProjectSetup && (
        <ProjectSetup 
          onClose={() => setShowProjectSetup(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {!showProjectSetup && (
        <>
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Active Projects
              </CardTitle>
              <CardDescription>
                Select a project to access its management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <Card 
                    key={project.id}
                    className="hover:border-blue-400 cursor-pointer transition-colors"
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">{project.projectName}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {project.projectType}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {project.startDate}
                            </span>
                          </div>
                          <div className="mt-3 text-sm">
                            PM: {project.projectManager}
                          </div>
                        </div>
                        <div className="text-right">
                          {project.status === 'planning' ? (
                            <Badge className="bg-yellow-100 text-yellow-800">🟡 Planning</Badge>
                          ) : project.status === 'in-progress' ? (
                            <Badge className="bg-green-100 text-green-800">🟢 In Progress</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">✅ Complete</Badge>
                          )}
                          <div className="mt-2 text-sm">
                            {project.completion}% Complete
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Module Tabs */}
          <Tabs defaultValue="qa-itp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qa-itp" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Quality Assurance / ITP
              </TabsTrigger>
              <TabsTrigger value="material-handover" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Material Handover
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qa-itp" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Quality Assurance / ITP (Inspection Test Plan)</CardTitle>
                      <CardDescription>
                        Create and track inspection hold points, collect evidence, and generate sign-off records
                      </CardDescription>
                    </div>
                    <Button onClick={() => setActiveQAForm(true)} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      New QA Inspection
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeQAForm ? (
                    <QAITPForm onClose={() => setActiveQAForm(false)} />
                  ) : (
                    <QAITPTracker onNewInspection={() => setActiveQAForm(true)} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="material-handover" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Material Handover</CardTitle>
                  <CardDescription>
                    Track material deliveries and handovers between trades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MaterialHandover />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Projects;
