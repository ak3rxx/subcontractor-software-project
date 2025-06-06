
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, Calendar, Users, FileText, AlertTriangle, 
  Package, ClipboardCheck, MessageSquare, CheckCircle2,
  TrendingUp, Clock, MapPin, Plus
} from 'lucide-react';
import ProgrammeTracker from './ProgrammeTracker';
import DocumentManager from './DocumentManager';
import VariationManager from './VariationManager';
import RFIManager from './RFIManager';
import TaskManager from './TaskManager';
import TeamNotes from './TeamNotes';

interface ProjectDashboardProps {
  projectData?: any;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectData }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample project data
  const project = projectData || {
    projectName: 'Riverside Apartments Development',
    projectType: 'Residential',
    status: 'in-progress',
    completion: 65,
    startDate: '2024-01-15',
    estimatedCompletion: '2024-08-30',
    siteAddress: '123 River Street, Brisbane QLD 4000',
    projectManager: 'Sarah Johnson'
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

  // Sample metrics
  const metrics = {
    milestones: { completed: 8, total: 12 },
    deliveries: { thisWeek: 3, pending: 2 },
    variations: { approved: 5, pending: 2 },
    rfis: { open: 3, overdue: 1 },
    tasks: { completed: 24, active: 8 }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.projectName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {project.projectType}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.siteAddress}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                PM: {project.projectManager}
              </span>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(project.status)}
            <div className="text-sm text-gray-600 mt-2">
              {project.startDate} → {project.estimatedCompletion}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Project Progress</span>
            <span className="text-sm text-gray-600">{project.completion}% Complete</span>
          </div>
          <Progress value={project.completion} className="h-2" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="programme" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Programme
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="variations" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            Variations
          </TabsTrigger>
          <TabsTrigger value="rfis" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            RFIs
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Milestones</p>
                    <p className="text-2xl font-bold">{metrics.milestones.completed}/{metrics.milestones.total}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Deliveries</p>
                    <p className="text-2xl font-bold">{metrics.deliveries.thisWeek}</p>
                    <p className="text-xs text-gray-500">This week</p>
                  </div>
                  <Package className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Variations</p>
                    <p className="text-2xl font-bold">{metrics.variations.pending}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">RFIs</p>
                    <p className="text-2xl font-bold">{metrics.rfis.open}</p>
                    <p className="text-xs text-red-500">{metrics.rfis.overdue} overdue</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Tasks</p>
                    <p className="text-2xl font-bold">{metrics.tasks.active}</p>
                    <p className="text-xs text-gray-500">{metrics.tasks.completed} done</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Material delivery completed</p>
                    <p className="text-xs text-gray-600">Timber Supply Co - Level 3 North Wing</p>
                  </div>
                  <span className="text-xs text-gray-500">2h ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New variation submitted</p>
                    <p className="text-xs text-gray-600">Additional electrical points - Unit 3A</p>
                  </div>
                  <span className="text-xs text-gray-500">4h ago</span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">QA inspection passed</p>
                    <p className="text-xs text-gray-600">Door installation - Final inspection</p>
                  </div>
                  <span className="text-xs text-gray-500">1d ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Alerts & Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <Clock className="h-5 w-5 text-red-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">1 RFI overdue</p>
                    <p className="text-xs text-red-600">Bathroom fixture specifications - Due 2 days ago</p>
                  </div>
                  <Button size="sm" variant="outline">View RFI</Button>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Delivery schedule conflict</p>
                    <p className="text-xs text-yellow-600">Steel delivery scheduled before foundation completion</p>
                  </div>
                  <Button size="sm" variant="outline">Review Schedule</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programme">
          <ProgrammeTracker projectName={project.projectName} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager projectName={project.projectName} />
        </TabsContent>

        <TabsContent value="variations">
          <VariationManager projectName={project.projectName} />
        </TabsContent>

        <TabsContent value="rfis">
          <RFIManager projectName={project.projectName} />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskManager projectName={project.projectName} />
        </TabsContent>

        <TabsContent value="team">
          <TeamNotes projectName={project.projectName} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
