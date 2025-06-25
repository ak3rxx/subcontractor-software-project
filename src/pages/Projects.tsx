import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import ProjectSetup from '@/components/projects/ProjectSetup';
import ProjectDashboard from '@/components/projects/ProjectDashboard';
import TopNav from '@/components/TopNav';

const Projects = () => {
  const { user, signOut } = useAuth();
  const { projects, loading, createProject } = useProjects();
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const handleProjectCreated = async (projectData: any) => {
    const newProject = await createProject(projectData);
    if (newProject) {
      setSelectedProject(newProject);
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
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1 container mx-auto py-6 space-y-6">
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
          </div>

          <ProjectDashboard projectData={selectedProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex-1 container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Projects Management</h1>
            <p className="text-muted-foreground">Manage your construction projects and workflows</p>
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
        )}
      </div>
    </div>
  );
};

export default Projects;
