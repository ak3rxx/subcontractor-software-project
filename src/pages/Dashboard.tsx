
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TopNav from '@/components/TopNav';
import { useProjects } from '@/hooks/useProjects';
import { useTasks } from '@/hooks/useTasks';
import { useNavigate } from 'react-router-dom';
import { useQAInspectionCoordination } from '@/hooks/useDataCoordination';
import { Building, Calendar, FileCheck, Shield, AlertTriangle, CheckSquare, Clock, Plus, Activity, MessageSquare, Milestone, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const { projects, loading: projectsLoading, refetch: refetchProjects } = useProjects();
  const { tasks, loading: tasksLoading } = useTasks();
  const navigate = useNavigate();
  
  // Add optimistic update state
  const [optimisticCounts, setOptimisticCounts] = useState({
    qaInspections: 0,
    lastActivity: null as any
  });

  // Handle QA inspection events for real-time dashboard updates
  const handleQARefresh = useCallback(() => {
    console.log('Dashboard: QA inspection event received, refreshing data');
    refetchProjects();
    
    // Add optimistic activity update
    setOptimisticCounts(prev => ({
      ...prev,
      qaInspections: prev.qaInspections + 1,
      lastActivity: {
        id: `qa-inspection-${Date.now()}`,
        type: 'qa_inspection',
        action: 'created',
        description: 'New QA inspection created',
        timestamp: new Date().toISOString(),
        icon: <FileCheck className="h-4 w-4 text-green-500" />
      }
    }));
  }, [refetchProjects]);

  // Set up QA inspection coordination
  useQAInspectionCoordination(handleQARefresh);

  // Calculate real statistics from projects
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const totalProjects = projects.length;

  // Calculate task statistics
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in-progress').length;

  // Mock RFI data - to be replaced with real data later
  const openRFIs = 3;
  const upcomingMilestones = 5;

  // Generate recent activities from projects and tasks
  const getRecentActivities = () => {
    const activities = [];

    // Add optimistic QA activity if available
    if (optimisticCounts.lastActivity) {
      activities.push(optimisticCounts.lastActivity);
    }

    // Add project-based activities
    projects.forEach(project => {
      if (project.created_at) {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          action: 'created',
          description: `Project "${project.name}" was created`,
          timestamp: project.created_at,
          projectName: project.name,
          icon: <Building className="h-4 w-4 text-blue-500" />
        });
      }
      
      if (project.status === 'in-progress') {
        activities.push({
          id: `project-progress-${project.id}`,
          type: 'project',
          action: 'status_change',
          description: `Project "${project.name}" status changed to in-progress`,
          timestamp: project.updated_at || project.created_at,
          projectName: project.name,
          icon: <Activity className="h-4 w-4 text-green-500" />
        });
      }
    });

    // Add task-based activities
    tasks.forEach(task => {
      if (task.created_at) {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          action: task.status === 'completed' ? 'completed' : 'created',
          description: `Task "${task.title}" was ${task.status === 'completed' ? 'completed' : 'created'}${task.project_name ? ` in ${task.project_name}` : ''}`,
          timestamp: task.status === 'completed' ? task.completed_date || task.updated_at : task.created_at,
          projectName: task.project_name,
          icon: task.status === 'completed' 
            ? <CheckSquare className="h-4 w-4 text-green-500" />
            : <Clock className="h-4 w-4 text-blue-500" />
        });
      }
    });

    // Sort by timestamp (most recent first) and take top 10
    return activities
      .filter(activity => activity.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const recentActivities = getRecentActivities();

  const handleCreateProject = () => {
    navigate('/projects');
  };

  const handleViewProjects = () => {
    navigate('/projects');
  };

  const handleViewTasks = () => {
    navigate('/tasks');
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return activityTime.toLocaleDateString();
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
              <Button variant="outline" onClick={handleViewAnalytics} className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" onClick={handleViewProjects} data-tour="view-projects-btn">
                View All Projects
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateProject} data-tour="new-project-btn">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
          
          {/* Real Stats Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">
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
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleViewTasks}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
                <p className="text-xs text-amber-500">Across all projects</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
                <MessageSquare className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openRFIs}</div>
                <p className="text-xs text-orange-500">Awaiting response</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Milestones</CardTitle>
                <Milestone className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingMilestones}</div>
                <p className="text-xs text-blue-500">Next 30 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Projects Overview */}
          <Card className="mb-8" data-tour="project-cards">
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
              <CardDescription>Latest updates across all your projects and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No recent activity</p>
                    <p className="text-sm">Start working on projects and tasks to see activity here.</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        {activity.projectName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Project: {activity.projectName}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
