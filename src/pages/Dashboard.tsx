import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TopNav from '@/components/TopNav';
import { useProjects } from '@/hooks/useProjects';
import { Building, Calendar, FileCheck, Shield, AlertTriangle, CheckSquare, Clock } from 'lucide-react';

const Dashboard = () => {
  const { projects, loading } = useProjects();

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-600">Welcome back to your construction management hub</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Export</Button>
              <Button className="bg-blue-600 hover:bg-blue-700">New Project</Button>
            </div>
          </div>
          
          {/* Enhanced Stats Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Building className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-green-500">
                  {projects.filter(p => p.status === 'in-progress').length} in progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <CheckSquare className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-amber-500">5 require action</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Issues & Alerts</CardTitle>
                <AlertTriangle className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-red-500">1 high priority</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Milestones</CardTitle>
                <Clock className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9</div>
                <p className="text-xs text-gray-500">Next in 3 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Enhanced Projects Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>Your active construction projects - click to access project dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Projects</h3>
                  <p className="text-gray-600 mb-4">Create your first project to get started</p>
                  <Button>Create Project</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.slice(0, 6).map((project) => (
                      <div key={project.id} className="p-4 border rounded-lg hover:shadow-md hover:border-blue-400 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{project.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'in-progress' ? 'bg-green-100 text-green-800' : 
                            project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {project.project_type || 'Construction Project'}
                        </p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {project.start_date ? `Started: ${new Date(project.start_date).toLocaleDateString()}` : 'Start date TBD'}
                          </span>
                          {project.total_budget && (
                            <span>${project.total_budget.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {projects.length > 6 && (
                    <div className="flex justify-center">
                      <Button variant="outline">View All Projects</Button>
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
                {[
                  {
                    action: "QA inspection completed",
                    project: "Riverside Apartments",
                    time: "2 hours ago",
                    user: "Site Supervisor"
                  },
                  {
                    action: "Budget variation approved",
                    project: "Commercial Plaza",
                    time: "Yesterday",
                    user: "Project Manager"
                  },
                  {
                    action: "Material delivery scheduled",
                    project: "City Hospital Wing",
                    time: "2 days ago",
                    user: "Site Coordinator"
                  },
                  {
                    action: "Document uploaded to compliance folder",
                    project: "Westside Renovation",
                    time: "3 days ago",
                    user: "Admin"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center p-3 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-600">Project: {activity.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{activity.user}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
