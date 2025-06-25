
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TopNav from '@/components/TopNav';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import { Building, Calendar, FileCheck, Shield, AlertTriangle, CheckSquare, Clock, Plus, Activity } from 'lucide-react';

const Dashboard = () => {
  const { projects, loading: projectsLoading } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const navigate = useNavigate();

  // Calculate real statistics from projects
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const totalProjects = projects.length;
  const planningProjects = projects.filter(p => p.status === 'planning').length;
  const completedProjects = projects.filter(p => p.status === 'complete').length;

  // Calculate task statistics
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  const handleCreateProject = () => {
    navigate('/projects');
  };

  const handleViewProjects = () => {
    navigate('/projects');
  };

  const handleViewTasks = () => {
    navigate('/tasks');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back to your construction management hub</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleViewProjects}>
                View All Projects
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateProject}>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
          
          {/* Real Stats Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewProjects}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Building className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProjects}</div>
                <p className="text-xs text-green-500">
                  {activeProjects} active
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewProjects}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <CheckSquare className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeProjects}</div>
                <p className="text-xs text-blue-500">{planningProjects} in planning</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewTasks}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
                <p className="text-xs text-amber-500">{completedTasks} completed</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedProjects}</div>
                <p className="text-xs text-green-500">Projects finished</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Projects Overview */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Project Overview</CardTitle>
                  <CardDescription>Your active construction projects - click to access project dashboard</CardDescription>
                </div>
                <Button variant="outline" onClick={handleViewProjects}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Projects</h3>
                  <p className="text-gray-600 mb-4">Create your first project to get started</p>
                  <Button onClick={handleCreateProject}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.slice(0, 6).map((project) => (
                      <div 
                        key={project.id} 
                        className="p-4 border rounded-lg hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                        onClick={() => navigate('/projects')}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium truncate">{project.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'in-progress' ? 'bg-green-100 text-green-800' : 
                            project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                            project.status === 'complete' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {project.project_type || 'Construction Project'}
                        </p>
                        {project.site_address && (
                          <p className="text-xs text-gray-500 mb-2 truncate">
                            📍 {project.site_address}
                          </p>
                        )}
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {project.start_date ? `Started: ${new Date(project.start_date).toLocaleDateString()}` : 'Start date TBD'}
                          </span>
                          {project.total_budget && (
                            <span className="font-medium">${project.total_budget.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {projects.length > 6 && (
                    <div className="flex justify-center">
                      <Button variant="outline" onClick={handleViewProjects}>
                        View All {projects.length} Projects
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across your projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Activity tracking coming soon...</p>
                  <p className="text-sm">Task completions, project updates, and team activities will appear here.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
