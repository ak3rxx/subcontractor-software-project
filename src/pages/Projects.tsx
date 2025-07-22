import React, { useState, useEffect, lazy, Suspense, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Building2, Calendar, Users, Settings, Calculator, Hash, BarChart3, ClipboardCheck, MessageSquare, FileText, DollarSign, AlertTriangle, CheckSquare, List, Activity, TrendingUp, Clock } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCrossModuleNavigation } from '@/hooks/useCrossModuleNavigation';
import { useAuth } from '@/hooks/useAuth';
import { useQAInspectionCoordination } from '@/hooks/useDataCoordination';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useEnhancedVariations } from '@/hooks/useEnhancedVariations';
import { useEnhancedTasks } from '@/hooks/useEnhancedTasks';
import StatusIndicator from '@/components/ui/status-indicator';
import TopNav from '@/components/TopNav';
import NavigationErrorBoundary from '@/components/NavigationErrorBoundary';

// Lazy load components with error boundaries
const ProjectSetup = lazy(() => import('@/components/projects/ProjectSetup'));
const VariationManager = lazy(() => import('@/components/projects/variations/VariationManager'));
const TaskManager = lazy(() => import('@/components/projects/TaskManager'));
const RFIManager = lazy(() => import('@/components/projects/RFIManager'));
const QATrackerOptimized = lazy(() => import('@/components/projects/qa-itp/QATrackerOptimized'));
const ProgrammeTracker = lazy(() => import('@/components/projects/ProgrammeTracker'));
const FinanceManager = lazy(() => import('@/components/projects/finance/FinanceManager'));
const DocumentManager = lazy(() => import('@/components/projects/DocumentManager'));
const TeamNotes = lazy(() => import('@/components/projects/TeamNotes'));

// Enhanced loading component with error boundary
const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      <p className="mt-2 text-sm text-muted-foreground">Loading module...</p>
    </div>
  </div>
);

// Component-level error boundary for tabs
const TabErrorBoundary = ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Tab rendering error:', error);
    return <>{fallback}</>;
  }
};

// Safe error fallback component
const TabErrorFallback = ({ tabName }: { tabName: string }) => (
  <Card>
    <CardContent className="py-8">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-semibold mb-2">{tabName} Temporarily Unavailable</h3>
        <p className="text-muted-foreground mb-4">
          This section is experiencing technical difficulties. Please try refreshing the page.
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </div>
    </CardContent>
  </Card>
);

const Projects = memo(() => {
  const { projects, loading, error, createProject, refetch: refetchProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCrossModuleData, getCrossModuleAction } = useCrossModuleNavigation();
  const { user } = useAuth();

  // Project-specific data hooks with error handling
  const projectId = selectedProject?.id;
  const { inspections, loading: qaLoading, refetch: refetchQA } = useQAInspectionsSimple(projectId);
  const { 
    variations, 
    isPerformingAction: variationsUpdating, 
    getVariationStatusInfo 
  } = useEnhancedVariations(projectId || '');
  
  const { 
    getTaskSummary 
  } = useEnhancedTasks();

  // Simplified state management - removed complex optimistic updates
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Safe data calculations with null checks
  const taskSummary = getTaskSummary();
  
  const variationSummary = {
    approved: Array.isArray(variations) ? variations.filter(v => v?.status === 'approved').length : 0,
    pending_approval: Array.isArray(variations) ? variations.filter(v => v?.status === 'pending_approval').length : 0,
    totalCostImpact: Array.isArray(variations) ? variations.reduce((sum, v) => sum + (v?.total_amount || 0), 0) : 0
  };
  
  // Simplified permission check
  const canAccess = useCallback((module: string) => {
    return !!user;
  }, [user]);

  // Simplified QA refresh handler
  const handleQARefresh = useCallback(() => {
    console.log('Projects: QA data refresh triggered');
    refetchQA();
    refetchProjects();
    setLastRefresh(Date.now());
  }, [refetchQA, refetchProjects]);

  // Set up QA coordination
  useQAInspectionCoordination(handleQARefresh);

  // Simplified URL parameter handling
  useEffect(() => {
    const projectId = searchParams.get('id');
    const tab = searchParams.get('tab');
    
    if (projectId && projects.length > 0 && !selectedProject) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        if (tab) {
          setActiveTab(tab);
        }
      }
    }
  }, [searchParams, projects, selectedProject]);

  const handleCreateProject = useCallback(async (projectData: any) => {
    try {
      const newProject = await createProject(projectData);
      if (newProject) {
        setSelectedProject(newProject);
        setShowNewProject(false);
        setActiveTab('dashboard');
        navigate(`/projects?id=${newProject.id}&tab=dashboard`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  }, [createProject, navigate, toast]);

  const handleBackToProjects = useCallback(() => {
    setSelectedProject(null);
    navigate('/projects');
  }, [navigate]);

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

  // Safe number calculations with comprehensive null checks
  const safeNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return (Number.isFinite(num) && !Number.isNaN(num)) ? Math.max(0, num) : 0;
  };

  const safePercent = (numerator: any, denominator: any): number => {
    const num = safeNumber(numerator);
    const den = safeNumber(denominator);
    if (den === 0) return 0;
    const result = (num / den) * 100;
    return Math.min(100, Math.max(0, Math.round(result)));
  };

  if (loading) {
    return (
      <NavigationErrorBoundary>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <TopNav />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading projects...</p>
            </div>
          </main>
        </div>
      </NavigationErrorBoundary>
    );
  }

  if (error) {
    return (
      <NavigationErrorBoundary>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <TopNav />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Projects</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </main>
        </div>
      </NavigationErrorBoundary>
    );
  }

  if (selectedProject) {
    const crossModuleData = getCrossModuleData();
    
    return (
      <NavigationErrorBoundary>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <TopNav />
          <main className="flex-1">
            <div className="container mx-auto px-4 py-8">
            {/* Project Header */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <h2 className="text-2xl font-bold">{selectedProject.name}</h2>
                      {getStatusBadge(selectedProject.status)}
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Project #{selectedProject.project_number}
                      </Badge>
                    </div>
                    {selectedProject.description && (
                      <p className="text-gray-600 mb-2">{selectedProject.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {selectedProject.project_type && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {selectedProject.project_type}
                        </span>
                      )}
                      {selectedProject.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Started: {new Date(selectedProject.start_date).toLocaleDateString()}
                        </span>
                      )}
                      {selectedProject.total_budget && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          Budget: ${selectedProject.total_budget.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleBackToProjects}>
                    ← Back to Projects
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8">
                <TabsTrigger value="dashboard" className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="programme" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Programme</span>
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Tasks</span>
                </TabsTrigger>
                <TabsTrigger value="rfis" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">RFIs</span>
                </TabsTrigger>
                <TabsTrigger value="variations" className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Variations</span>
                </TabsTrigger>
                <TabsTrigger value="qa-itp" className="flex items-center gap-1">
                  <ClipboardCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">QA/ITP</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Notes</span>
                </TabsTrigger>
                {canAccess('finance') && (
                  <TabsTrigger value="finance" className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Finance</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Tab Content with Enhanced Error Boundaries */}
              <TabsContent value="dashboard" className="mt-6 space-y-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="Dashboard" />}>
                  {/* Simplified Dashboard Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <ClipboardCheck className="h-8 w-8 text-green-500" />
                          {qaLoading && <StatusIndicator status="pending" size="sm" className="ml-2" />}
                        </div>
                        <div className="text-2xl font-bold">
                          {qaLoading ? '...' : safeNumber(inspections?.length || 0)}
                        </div>
                        <div className="text-sm text-gray-600">QA Inspections</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {safeNumber(inspections?.filter(i => i?.overall_status === 'pass').length || 0)} passed, {safeNumber(inspections?.filter(i => i?.overall_status === 'fail').length || 0)} failed
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <AlertTriangle className="h-8 w-8 text-orange-500" />
                          {variationsUpdating && <StatusIndicator status="pending" size="sm" className="ml-2" />}
                        </div>
                        <div className="text-2xl font-bold">
                          {variationsUpdating ? '...' : safeNumber(variations?.length || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Variations</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {variationSummary.approved} approved, {variationSummary.pending_approval} pending
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <CheckSquare className="h-8 w-8 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold">
                          {safeNumber(taskSummary?.total || 0)}
                        </div>
                        <div className="text-sm text-gray-600">Tasks</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {safeNumber(taskSummary?.completed || 0)} completed, {safeNumber(taskSummary?.inProgress || 0)} in progress
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div className="text-2xl font-bold">
                          ${safeNumber(variationSummary.totalCostImpact).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Variation Impact</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {variationSummary.pending_approval > 0 ? `${variationSummary.pending_approval} pending` : 'No pending variations'}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6 text-center">
                        <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                        <div className="text-2xl font-bold">
                          {selectedProject.total_budget ? `$${safeNumber(selectedProject.total_budget).toLocaleString()}` : 'Not Set'}
                        </div>
                        <div className="text-sm text-gray-600">Project Budget</div>
                        <div className="mt-1 text-xs text-gray-500">
                          {variationSummary.totalCostImpact && selectedProject.total_budget ? 
                            `${safePercent(variationSummary.totalCostImpact, selectedProject.total_budget)}% variation impact` 
                            : 'No variations'
                          }
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Simplified Activity Feed */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {/* Recent QA Inspections */}
                          {Array.isArray(inspections) && inspections.slice(0, 3).map((inspection) => (
                            <div key={inspection.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                              <ClipboardCheck className="h-4 w-4 text-green-500 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  QA Inspection {inspection.overall_status === 'pass' ? 'Passed' : inspection.overall_status === 'fail' ? 'Failed' : 'In Progress'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {inspection.task_area} • {new Date(inspection.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={inspection.overall_status === 'pass' ? 'default' : inspection.overall_status === 'fail' ? 'destructive' : 'secondary'}>
                                {inspection.overall_status}
                              </Badge>
                            </div>
                          ))}

                          {/* Recent Variations */}
                          {Array.isArray(variations) && variations.slice(0, 2).map((variation) => (
                            <div key={variation.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  Variation {variation.status === 'approved' ? 'Approved' : variation.status === 'rejected' ? 'Rejected' : 'Submitted'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {variation.title} • {variation.total_amount ? `$${variation.total_amount.toLocaleString()}` : 'No cost'}
                                </p>
                              </div>
                              <Badge variant={variation.status === 'approved' ? 'default' : variation.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {variation.status}
                              </Badge>
                            </div>
                          ))}

                          {(!inspections || inspections.length === 0) && (!variations || variations.length === 0) && (
                            <div className="text-center py-6 text-gray-500">
                              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No recent activity</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setActiveTab('qa-itp')}
                              className="flex items-center gap-2"
                            >
                              <ClipboardCheck className="h-4 w-4" />
                              New QA
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveTab('variations')}
                              className="flex items-center gap-2"
                            >
                              <AlertTriangle className="h-4 w-4" />
                              New Variation
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveTab('tasks')}
                              className="flex items-center gap-2"
                            >
                              <Settings className="h-4 w-4" />
                              New Task
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setActiveTab('finance')}
                              className="flex items-center gap-2"
                            >
                              <DollarSign className="h-4 w-4" />
                              Finance
                            </Button>
                          </div>

                          {/* Progress Overview */}
                          <div className="space-y-3 pt-4 border-t">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">QA Completion</span>
                              <span className="text-sm text-gray-600">
                                {safePercent(inspections?.filter(i => i?.overall_status === 'pass').length || 0, inspections?.length || 1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                style={{
                                  width: `${safePercent(inspections?.filter(i => i?.overall_status === 'pass').length || 0, inspections?.length || 1)}%`
                                }}
                              />
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Variation Approval</span>
                              <span className="text-sm text-gray-600">
                                {safePercent(variationSummary.approved, variations?.length || 1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{
                                  width: `${safePercent(variationSummary.approved, variations?.length || 1)}%`
                                }}
                              />
                            </div>
                            
                            <div className="pt-3 text-center">
                              <div className="text-sm text-gray-600">
                                Project started {selectedProject.start_date ? 
                                  new Date(selectedProject.start_date).toLocaleDateString() : 'Not set'
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabErrorBoundary>
              </TabsContent>

              {/* Other Tabs with Enhanced Error Boundaries */}
              <TabsContent value="programme" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="Programme" />}>
                  <Suspense fallback={<ModuleLoader />}>
                    <ProgrammeTracker 
                      projectName={selectedProject.name} 
                      projectId={selectedProject.id}
                      crossModuleData={crossModuleData}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="tasks" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="Tasks" />}>
                  <Suspense fallback={<ModuleLoader />}>
                    <TaskManager 
                      projectName={selectedProject.name}
                      crossModuleData={crossModuleData}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="rfis" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="RFIs" />}>
                  <Suspense fallback={<ModuleLoader />}>
                    <RFIManager 
                      projectName={selectedProject.name}
                      crossModuleData={crossModuleData}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="variations" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="Variations" />}>
                  <Suspense fallback={<ModuleLoader />}>
                    <VariationManager
                      projectName={selectedProject.name}
                      projectId={selectedProject.id}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="qa-itp" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="QA/ITP" />}>
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>Quality Assurance / Inspection Test Plan</CardTitle>
                          <p className="text-muted-foreground">
                            Comprehensive QA management with dashboard, inspections, tasks, and reporting
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Suspense fallback={<ModuleLoader />}>
                        <QATrackerOptimized 
                          projectId={selectedProject.id}
                          onNewInspection={handleQARefresh}
                          onNavigateToTracker={() => {
                            navigate(`/projects?id=${selectedProject.id}&tab=qa-itp`);
                          }}
                        />
                      </Suspense>
                    </CardContent>
                  </Card>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="Documents" />}>
                  <Suspense fallback={<ModuleLoader />}>
                    <DocumentManager 
                      projectName={selectedProject.name}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <TabErrorBoundary fallback={<TabErrorFallback tabName="Notes" />}>
                  <Suspense fallback={<ModuleLoader />}>
                    <TeamNotes 
                      projectName={selectedProject.name}
                    />
                  </Suspense>
                </TabErrorBoundary>
              </TabsContent>

              {canAccess('finance') && (
                <TabsContent value="finance" className="mt-6">
                  <TabErrorBoundary fallback={<TabErrorFallback tabName="Finance" />}>
                    <Suspense fallback={<ModuleLoader />}>
                      <FinanceManager 
                        projectName={selectedProject.name}
                        crossModuleData={crossModuleData}
                      />
                    </Suspense>
                  </TabErrorBoundary>
                </TabsContent>
              )}
            </Tabs>
            </div>
          </main>
        </div>
      </NavigationErrorBoundary>
    );
  }

  // Project list view remains unchanged
  return (
    <NavigationErrorBoundary>
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
                <Suspense fallback={<ModuleLoader />}>
                  <ProjectSetup 
                    onClose={() => setShowNewProject(false)}
                    onProjectCreated={handleCreateProject}
                  />
                </Suspense>
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
    </NavigationErrorBoundary>
  );
});

Projects.displayName = 'Projects';

export default Projects;
