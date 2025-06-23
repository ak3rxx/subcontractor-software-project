
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Users, Calendar, DollarSign, Package, ClipboardCheck, MessageSquare, Settings, BarChart3, AlertTriangle } from 'lucide-react';
import QAITPTracker from './QAITPTracker';
import QAITPForm from './QAITPForm';
import MaterialHandover from './MaterialHandover';
import TaskManager from './TaskManager';
import TeamNotes from './TeamNotes';
import DocumentManager from './DocumentManager';
import VariationManager from './VariationManager';
import RFIManager from './RFIManager';
import ProgrammeTracker from './ProgrammeTracker';
import FinanceManager from './finance/FinanceManager';
import DeliveryScheduler from './DeliveryScheduler';

interface ProjectDashboardProps {
  projectData: {
    id: string;
    name: string;
    description?: string;
    project_type?: string;
    status: string;
    start_date?: string;
    estimated_completion?: string;
    site_address?: string;
    total_budget?: number;
  };
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectData }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeQAForm, setActiveQAForm] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <Badge className="bg-yellow-100 text-yellow-800">🟡 Planning</Badge>;
      case 'in-progress': return <Badge className="bg-green-100 text-green-800">🟢 In Progress</Badge>;
      case 'paused': return <Badge className="bg-orange-100 text-orange-800">🟠 Paused</Badge>;
      case 'complete': return <Badge className="bg-blue-100 text-blue-800">✅ Complete</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">{projectData.name}</h2>
                {getStatusBadge(projectData.status)}
              </div>
              {projectData.description && (
                <p className="text-gray-600 mb-2">{projectData.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {projectData.project_type && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {projectData.project_type}
                  </span>
                )}
                {projectData.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Started: {new Date(projectData.start_date).toLocaleDateString()}
                  </span>
                )}
                {projectData.total_budget && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Budget: ${projectData.total_budget.toLocaleString()}
                  </span>
                )}
              </div>
              {projectData.site_address && (
                <div className="mt-2 text-sm text-gray-600">
                  📍 {projectData.site_address}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Project Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="programme" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Programme</span>
          </TabsTrigger>
          <TabsTrigger value="qa-itp" className="flex items-center gap-1">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">QA/ITP</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Materials</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Notes</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="variations" className="flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Variations</span>
          </TabsTrigger>
          <TabsTrigger value="rfi" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">RFI</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <div className="text-2xl font-bold">{projectData.project_type || 'N/A'}</div>
                <div className="text-sm text-gray-600">Project Type</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <div className="text-2xl font-bold">
                  {projectData.start_date ? new Date(projectData.start_date).toLocaleDateString() : 'Not Set'}
                </div>
                <div className="text-sm text-gray-600">Start Date</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <div className="text-2xl font-bold">
                  {projectData.total_budget ? `$${projectData.total_budget.toLocaleString()}` : 'Not Set'}
                </div>
                <div className="text-sm text-gray-600">Total Budget</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <div className="text-2xl font-bold">Active</div>
                <div className="text-sm text-gray-600">Project Status</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programme" className="space-y-6">
          <ProgrammeTracker projectName={projectData.name} />
        </TabsContent>

        <TabsContent value="qa-itp" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {activeQAForm ? (
                <QAITPForm onClose={() => setActiveQAForm(false)} />
              ) : (
                <QAITPTracker onNewInspection={() => setActiveQAForm(true)} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <MaterialHandover />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Delivery Scheduler</CardTitle>
            </CardHeader>
            <CardContent>
              <DeliveryScheduler onClose={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskManager projectName={projectData.name} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <TeamNotes projectName={projectData.name} />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentManager projectName={projectData.name} />
        </TabsContent>

        <TabsContent value="variations" className="space-y-6">
          <VariationManager projectName={projectData.name} projectId={projectData.id} />
        </TabsContent>

        <TabsContent value="rfi" className="space-y-6">
          <RFIManager projectName={projectData.name} />
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <FinanceManager projectName={projectData.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDashboard;
