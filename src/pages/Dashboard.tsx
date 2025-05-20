
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Building, Calendar, FileCheck, Shield } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-600">Welcome back to your construction management hub</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Export</Button>
              <Button className="bg-construction-blue hover:bg-blue-700">New Project</Button>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <Building className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-green-500">+2 from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <FileCheck className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-amber-500">5 require action</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
                <Shield className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-red-500">1 high priority</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                <Calendar className="w-4 h-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9</div>
                <p className="text-xs text-gray-500">Next in 3 days</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content Tabs */}
          <Tabs defaultValue="projects" className="mb-8">
            <TabsList className="mb-6">
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="risks">Risk Management</TabsTrigger>
              <TabsTrigger value="clients">Client Portal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Active Projects</CardTitle>
                  <CardDescription>Manage your ongoing construction projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((project) => (
                        <div key={project} className="p-4 border rounded-lg hover:shadow-md hover:border-construction-blue transition-all cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Project #{project}</h3>
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Commercial Building Renovation
                          </p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Progress: 65%</span>
                            <span>Due: Jun 30</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center">
                      <Button variant="outline">View All Projects</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Document Management</CardTitle>
                  <CardDescription>Access and manage all your project documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Document management content would appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="risks">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                  <CardDescription>Monitor and mitigate project risks</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Risk assessment tools and reports would appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="clients">
              <Card>
                <CardHeader>
                  <CardTitle>Client Portal</CardTitle>
                  <CardDescription>Manage client communications and access</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Client management tools would appear here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
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
                    action: "Document uploaded",
                    project: "Riverside Apartments",
                    time: "2 hours ago",
                    user: "John Smith"
                  },
                  {
                    action: "Permit approved",
                    project: "Commercial Plaza",
                    time: "Yesterday",
                    user: "System"
                  },
                  {
                    action: "Risk assessment completed",
                    project: "City Hospital Wing",
                    time: "2 days ago",
                    user: "Sarah Johnson"
                  },
                  {
                    action: "New comment from client",
                    project: "Westside Renovation",
                    time: "3 days ago",
                    user: "Michael Brown"
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center p-3 border-b border-gray-100 last:border-0">
                    <div className="w-2 h-2 bg-construction-blue rounded-full mr-3"></div>
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
      
      <Footer />
    </div>
  );
};

export default Dashboard;
