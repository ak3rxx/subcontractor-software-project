
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Calendar, MapPin, DollarSign, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import ProjectSetup from '@/components/projects/ProjectSetup';
import ProjectDashboard from '@/components/projects/ProjectDashboard';
import TopNav from '@/components/TopNav';

const Projects = () => {
  const { user } = useAuth();
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
    const statusConfig = {
      'planning': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '📋' },
      'in-progress': { bg: 'bg-green-100', text: 'text-green-800', icon: '⚡' },
      'paused': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⏸️' },
      'complete': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '✅' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❓' };
    
    return (
      <Badge className={`${config.bg} ${config.text} font-medium`}>
        {config.icon} {status.replace('-', ' ')}
      </Badge>
    );
  };

  if (selectedProject) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopNav />
        <div className="flex-1 container mx-auto py-6 space-y-6 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
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
      
      <div className="flex-1 container mx-auto py-6 space-y-6 max-w-7xl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects Management</h1>
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
                <Building2 className="h-5 w-5 text-blue-600" />
                Active Projects ({projects.length})
              </CardTitle>
              <CardDescription>
                Select a project to access its management dashboard and tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Create your first project to start managing construction workflows, tasks, and team collaboration.
                  </p>
                  <Button onClick={() => setShowProjectSetup(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card 
                      key={project.id}
                      className="hover:border-blue-400 hover:shadow-lg cursor-pointer transition-all duration-200 group"
                      onClick={() => setSelectedProject(project)}
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold mb-1 group-hover:text-blue-600 transition-colors truncate">
                                {project.name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{project.project_type || 'Construction Project'}</span>
                              </div>
                            </div>
                            {getStatusBadge(project.status)}
                          </div>
                          
                          {project.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          
                          {project.site_address && (
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{project.site_address}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {project.start_date 
                                  ? new Date(project.start_date).toLocaleDateString()
                                  : 'Start TBD'
                                }
                              </span>
                            </div>
                            {project.total_budget && (
                              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                <DollarSign className="h-4 w-4" />
                                <span>{project.total_budget.toLocaleString()}</span>
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
