
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Package, Building2, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizations } from '@/hooks/useOrganizations';
import OrganizationSelector from '@/components/OrganizationSelector';
import QAITPForm from '@/components/projects/QAITPForm';
import QAITPTracker from '@/components/projects/QAITPTracker';
import MaterialHandover from '@/components/projects/MaterialHandover';
import ProjectSetup from '@/components/projects/ProjectSetup';
import ProjectDashboard from '@/components/projects/ProjectDashboard';

const Projects = () => {
  const { user, signOut } = useAuth();
  const { currentOrganization } = useOrganizations();
  const { projects, loading, createProject } = useProjects(currentOrganization?.id);
  const [activeQAForm, setActiveQAForm] = useState(false);
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleProjectCreated = async (projectData: any) => {
    const newProject = await createProject(projectData);
    if (newProject) {
      setSelectedProject(newProject);
      setActiveTab('overview');
      setShowProjectSetup(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <Badge className="bg-yellow-100 text-yellow-800">🟡 Planning</Badge>;
      case 'in-progress': return <Badge className="bg-green-100 text-green-800">🟢 In Progress</Badge>;
      case 'paused': return <Badge className="bg-orange-100 text-orange-800">🟠 Paused</Badge>;
      case 'complete': return <Badge className="bg-blue-100 text-blue-800">✅ Complete</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (selectedProject) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <OrganizationSelector />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedProject(null)}
            >
              ← Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
              <p className="text-muted-foreground">Project Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
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
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.email}
          </span>
          <Button onClick={() => setShowProjectSetup(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <OrganizationSelector />

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
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-4">Create your first project to get started</p>
                  <Button onClick={() => setShowProjectSetup(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
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
                            <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {project.project_type || 'Not specified'}
                              </span>
                              {project.start_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(project.start_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {project.site_address && (
                              <div className="mt-2 text-sm text-gray-600">
                                📍 {project.site_address}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {getStatusBadge(project.status)}
                            {project.total_budget && (
                              <div className="mt-2 text-sm font-medium">
                                ${project.total_budget.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
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
