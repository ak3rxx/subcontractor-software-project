
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, Calendar, Users, Settings, Calculator, Hash } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCrossModuleNavigation } from '@/hooks/useCrossModuleNavigation';
import TopNav from '@/components/TopNav';
import ProjectSetup from '@/components/projects/ProjectSetup';
import ProjectDashboard from '@/components/projects/ProjectDashboard';
import VariationManager from '@/components/projects/variations/VariationManager';
import TaskManager from '@/components/projects/TaskManager';
import RFIManager from '@/components/projects/RFIManager';
import QAITPTracker from '@/components/projects/qa-itp/QAITPTracker';
import ProgrammeTracker from '@/components/projects/ProgrammeTracker';
import FinanceManager from '@/components/projects/finance/FinanceManager';
import DocumentManager from '@/components/projects/DocumentManager';
import TeamNotes from '@/components/projects/TeamNotes';

const Projects = () => {
  const { projects, loading, createProject } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCrossModuleData, getCrossModuleAction } = useCrossModuleNavigation();

  // Handle URL parameters for cross-module integration
  useEffect(() => {
    const projectId = searchParams.get('id');
    const tab = searchParams.get('tab');
    const action = getCrossModuleAction();
    const crossModuleData = getCrossModuleData();

    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        if (tab) {
          setActiveTab(tab);
        }
        
        // Handle cross-module actions and show notification
        if (action && crossModuleData) {
          handleCrossModuleAction(action, crossModuleData, tab);
        }
      }
    }
  }, [searchParams, projects]);

  const handleCrossModuleAction = (action: string, data: any, tab: string | null) => {
    console.log('Cross-module action:', action, data, tab);
    
    // Show toast notification about the cross-module integration
    if (data.fromVariation) {
      const actionName = action.replace('create-', '').replace('-', ' ');
      toast({
        title: "Cross-Module Integration Active",
        description: `${actionName} form will auto-populate with data from variation ${data.variationNumber}`,
      });
    }
  };

  const handleCreateProject = async (projectData: any) => {
    const newProject = await createProject(projectData);
    if (newProject) {
      setSelectedProject(newProject);
      setShowNewProject(false);
      setActiveTab('dashboard');
      
      // Update URL to show the new project
      navigate(`/projects?id=${newProject.id}&tab=dashboard`);
    }
  };

  const handleNewInspection = () => {
    console.log('Creating new QA inspection for project:', selectedProject?.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge variant="secondary">Planning</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'paused':
        return <Badge variant="outline">Paused</Badge>;
      case 'complete':
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    navigate('/projects');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <TopNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </main>
      </div>
    );
  }

  if (selectedProject) {
    const crossModuleData = getCrossModuleData();
    
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <TopNav />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{selectedProject.name}</h1>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Project #{selectedProject.project_number}
                    </Badge>
                    {crossModuleData?.fromVariation && (
                      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                        🔗 Linked from Variation {crossModuleData.variationNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600">{selectedProject.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(selectedProject.status)}
                    <span className="text-sm text-gray-500">
                      Created: {new Date(selectedProject.created_at).toLocaleDateString()}
                    </span>
                    {selectedProject.total_budget && (
                      <span className="text-sm text-gray-500">
                        Budget: ${selectedProject.total_budget.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleBackToProjects}
                >
                  ← Back to Projects
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-9">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="variations">Variations</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="rfis">RFIs</TabsTrigger>
                <TabsTrigger value="qa">QA/ITP</TabsTrigger>
                <TabsTrigger value="programme">Programme</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="mt-6">
                <ProjectDashboard 
                  projectData={selectedProject}
                />
              </TabsContent>

              <TabsContent value="variations" className="mt-6">
                <VariationManager
                  projectName={selectedProject.name}
                  projectId={selectedProject.id}
                />
              </TabsContent>

              <TabsContent value="tasks" className="mt-6">
                <TaskManager 
                  projectName={selectedProject.name}
                  crossModuleData={crossModuleData}
                />
              </TabsContent>

              <TabsContent value="rfis" className="mt-6">
                <RFIManager 
                  projectName={selectedProject.name}
                  crossModuleData={crossModuleData}
                />
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <QAITPTracker 
                  projectId={selectedProject.id}
                  onNewInspection={handleNewInspection}
                />
              </TabsContent>

              <TabsContent value="programme" className="mt-6">
                <ProgrammeTracker 
                  projectName={selectedProject.name}
                  projectId={selectedProject.id}
                  crossModuleData={crossModuleData}
                />
              </TabsContent>

              <TabsContent value="finance" className="mt-6">
                <FinanceManager 
                  projectName={selectedProject.name}
                  crossModuleData={crossModuleData}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentManager 
                  projectName={selectedProject.name}
                />
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <TeamNotes 
                  projectName={selectedProject.name}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600">Manage your construction projects with integrated modules</p>
            </div>
            <Button onClick={() => setShowNewProject(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {showNewProject && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Project</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectSetup 
                  onClose={() => setShowNewProject(false)}
                  onProjectCreated={handleCreateProject}
                />
              </CardContent>
            </Card>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
              <p className="text-gray-600 mb-6">Create your first project to get started with the integrated management system</p>
              <Button onClick={() => setShowNewProject(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge variant="outline" className="flex items-center gap-1 text-xs">
                            <Hash className="h-2 w-2" />
                            #{project.project_number}
                          </Badge>
                        </div>
                        {getStatusBadge(project.status)}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Started: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>PM: {project.project_manager_id ? 'Assigned' : 'Not assigned'}</span>
                      </div>
                      {project.total_budget && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calculator className="h-4 w-4" />
                          <span>Budget: ${project.total_budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => {
                        setSelectedProject(project);
                        navigate(`/projects?id=${project.id}&tab=dashboard`);
                      }}
                    >
                      Open Project
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
