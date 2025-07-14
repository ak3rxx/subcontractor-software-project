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
import QuickActions from '@/components/ui/quick-actions';
import TopNav from '@/components/TopNav';
import NavigationErrorBoundary from '@/components/NavigationErrorBoundary';

// Lazy load heavy components for better performance
const ProjectSetup = lazy(() => import('@/components/projects/ProjectSetup'));
const VariationManager = lazy(() => import('@/components/projects/variations/VariationManager'));
const TaskManager = lazy(() => import('@/components/projects/TaskManager'));
const RFIManager = lazy(() => import('@/components/projects/RFIManager'));
const QATrackerOptimized = lazy(() => import('@/components/projects/qa-itp/QATrackerOptimized'));
const QAITPForm = lazy(() => import('@/components/projects/qa-itp/QAITPForm'));
const ProgrammeTracker = lazy(() => import('@/components/projects/ProgrammeTracker'));
const FinanceManager = lazy(() => import('@/components/projects/finance/FinanceManager'));
const DocumentManager = lazy(() => import('@/components/projects/DocumentManager'));
const TeamNotes = lazy(() => import('@/components/projects/TeamNotes'));

// Loading component for lazy loaded modules
const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      <p className="mt-2 text-sm text-muted-foreground">Loading module...</p>
    </div>
  </div>
);

const Projects = memo(() => {
  const { projects, loading, error, createProject, refetch: refetchProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [qaActiveTab, setQaActiveTab] = useState('dashboard');
  const [activeQAForm, setActiveQAForm] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCrossModuleData, getCrossModuleAction } = useCrossModuleNavigation();
  const { user } = useAuth();

  // Project-specific data hooks for dashboard with enhanced optimistic updates
  const projectId = selectedProject?.id;
  const { inspections, loading: qaLoading, refetch: refetchQA } = useQAInspectionsSimple(projectId);
  const { 
    variations, 
    isPerformingAction: variationsUpdating, 
    createVariation, 
    updateVariation, 
    changeVariationStatus,
    getVariationStatusInfo 
  } = useEnhancedVariations(projectId || '');
  
  const { 
    tasks, 
    isPerformingAction: tasksUpdating, 
    createTask, 
    updateTask, 
    changeTaskStatus,
    getTaskSummary 
  } = useEnhancedTasks();

  // Enhanced optimistic updates with cross-module synchronization
  const [optimisticUpdates, setOptimisticUpdates] = useState({
    qaInspections: 0,
    recentActivity: [] as any[]
  });

  // Get task summary for dashboard
  const taskSummary = getTaskSummary();
  
  // Calculate variation summary from enhanced data
  const variationSummary = {
    approved: variations.filter(v => v.status === 'approved').length,
    pending_approval: variations.filter(v => v.status === 'pending_approval').length,
    totalCostImpact: variations.reduce((sum, v) => sum + (v.total_amount || 0), 0)
  };
  
  // Memoized permission check for performance
  const canAccess = useCallback((module: string) => {
    return !!user; // All authenticated users can access all modules for now
  }, [user]);

  // Enhanced cross-module activity tracking
  const handleQARefresh = useCallback(() => {
    console.log('Project Dashboard: QA inspection event received, refreshing data');
    refetchQA();
    refetchProjects();
    
    // Add optimistic activity update with enhanced tracking
    setOptimisticUpdates(prev => ({
      ...prev,
      qaInspections: prev.qaInspections + 1,
      recentActivity: [
        {
          id: `qa-inspection-${Date.now()}`,
          type: 'qa_inspection',
          action: 'created',
          description: 'New QA inspection created',
          timestamp: new Date().toISOString(),
          module: 'QA',
          status: 'completed',
          icon: <ClipboardCheck className="h-4 w-4 text-green-500" />
        },
        ...prev.recentActivity
      ].slice(0, 10) // Keep only latest 10 activities
    }));
  }, [refetchQA, refetchProjects]);

  // Set up QA inspection coordination for real-time updates
  useQAInspectionCoordination(handleQARefresh);

  // Handle URL parameters for cross-module integration
  useEffect(() => {
    const projectId = searchParams.get('id');
    const tab = searchParams.get('tab');
    const action = getCrossModuleAction();
    const crossModuleData = getCrossModuleData();

    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setSelectedProject(project);
        if (tab) {
          setActiveTab(tab);
        }
        
        // Handle cross-module actions and show notification
        if (action && crossModuleData) {
          handleCrossModuleAction(action, crossModuleData, tab);
        }
      }
    }
  }, [searchParams, projects]);

  const handleCrossModuleAction = (action: string, data: any, tab: string | null) => {
    console.log('Cross-module action:', action, data, tab);
    
    // Show toast notification about the cross-module integration
    if (data.fromVariation) {
      const actionName = action.replace('create-', '').replace('-', ' ');
      toast({
        title: "Cross-Module Integration Active",
        description: `${actionName} form will auto-populate with data from variation ${data.variationNumber}`,
      });
    }
  };

  const handleCreateProject = useCallback(async (projectData: any) => {
    const newProject = await createProject(projectData);
    if (newProject) {
      setSelectedProject(newProject);
      setShowNewProject(false);
      setActiveTab('dashboard');
      
      // Update URL to show the new project
      navigate(`/projects?id=${newProject.id}&tab=dashboard`);
    }
  }, [createProject, navigate]);

  const handleNewInspection = useCallback(() => {
    setActiveQAForm(true);
  }, []);

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
            {/* Project Information Header */}
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
                      {crossModuleData?.fromVariation && (
                        <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                          🔗 Linked from Variation {crossModuleData.variationNumber}
                        </Badge>
                      )}
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
                    {selectedProject.site_address && (
                      <div className="mt-2 text-sm text-gray-600">
                        📍 {selectedProject.site_address}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleBackToProjects}
                    data-tour="back-to-projects-btn"
                  >
                    ← Back to Projects
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Consolidated Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-8 lg:grid-cols-8" data-tour="project-tabs">
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

              <TabsContent value="dashboard" className="mt-6 space-y-6">
                 {/* Enhanced Dashboard Overview Stats with Real-time Updates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <ClipboardCheck className="h-8 w-8 text-green-500" />
                        {qaLoading && <StatusIndicator status="pending" size="sm" className="ml-2" />}
                      </div>
                      <div className="text-2xl font-bold">
                        {qaLoading ? (
                          <StatusIndicator status="pending" message="Loading..." size="sm" />
                        ) : (
                          inspections.length + optimisticUpdates.qaInspections
                        )}
                      </div>
                      <div className="text-sm text-gray-600">QA Inspections</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {inspections.filter(i => i.overall_status === 'pass').length} passed, {inspections.filter(i => i.overall_status === 'fail').length} failed
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
                        {variationsUpdating ? (
                          <StatusIndicator status="pending" message="Updating..." size="sm" />
                        ) : (
                          variations.length
                        )}
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
                        {tasksUpdating && <StatusIndicator status="pending" size="sm" className="ml-2" />}
                      </div>
                      <div className="text-2xl font-bold">
                        {tasksUpdating ? (
                          <StatusIndicator status="pending" message="Updating..." size="sm" />
                        ) : (
                          taskSummary.total
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Tasks</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {taskSummary.completed} completed, {taskSummary.inProgress} in progress
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <DollarSign className="h-8 w-8 text-yellow-500" />
                        {variationsUpdating && <StatusIndicator status="pending" size="sm" className="ml-2" />}
                      </div>
                      <div className="text-2xl font-bold">
                        {variationSummary.totalCostImpact ? `$${variationSummary.totalCostImpact.toLocaleString()}` : '$0'}
                      </div>
                      <div className="text-sm text-gray-600">Variation Impact</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {variationSummary.pending_approval > 0 ? `${variationSummary.pending_approval} pending approval` : 'No pending variations'}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                      <div className="text-2xl font-bold">
                        {selectedProject.total_budget ? `$${selectedProject.total_budget.toLocaleString()}` : 'Not Set'}
                      </div>
                      <div className="text-sm text-gray-600">Project Budget</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {variationSummary.totalCostImpact && selectedProject.total_budget ? 
                          `${(((variationSummary.totalCostImpact / selectedProject.total_budget) * 100) || 0).toFixed(1)}% variation impact` 
                          : 'No variations'
                        }
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Real-time Activity Feed */}
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
                        {/* Show optimistic activity first */}
                        {optimisticUpdates.recentActivity.length > 0 && optimisticUpdates.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="mt-0.5">{activity.icon}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.module} • Just now
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Recent QA Inspections */}
                        {inspections.slice(0, 3).map((inspection) => (
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
                        {variations.slice(0, 2).map((variation) => (
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

                        {inspections.length === 0 && variations.length === 0 && optimisticUpdates.recentActivity.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No recent activity</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions & Module Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Quick Actions & Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Quick Action Buttons */}
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

                        {/* Module Status Overview */}
                        <div className="space-y-3 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">QA Completion</span>
                            <span className="text-sm text-gray-600">
                              {inspections.length > 0 ? 
                                `${Math.round((inspections.filter(i => i.overall_status === 'pass').length / inspections.length) * 100)}%` 
                                : '0%'
                              }
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                              style={{
                                width: inspections.length > 0 ? 
                                  `${(inspections.filter(i => i.overall_status === 'pass').length / inspections.length) * 100}%` 
                                  : '0%'
                              }}
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Variation Approval</span>
                            <span className="text-sm text-gray-600">
                              {variations.length > 0 ? 
                                `${Math.round(((variationSummary?.approved || 0) / variations.length) * 100)}%` 
                                : '0%'
                              }
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{
                                width: variations.length > 0 ? 
                                  `${((variationSummary?.approved || 0) / variations.length) * 100}%` 
                                  : '0%'
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
              </TabsContent>

              <TabsContent value="programme" className="mt-6">
                <Suspense fallback={<ModuleLoader />}>
                  <ProgrammeTracker 
                    projectName={selectedProject.name} 
                    projectId={selectedProject.id}
                    crossModuleData={crossModuleData}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="tasks" className="mt-6">
                <Suspense fallback={<ModuleLoader />}>
                  <TaskManager 
                    projectName={selectedProject.name}
                    crossModuleData={crossModuleData}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="rfis" className="mt-6">
                <Suspense fallback={<ModuleLoader />}>
                  <RFIManager 
                    projectName={selectedProject.name}
                    crossModuleData={crossModuleData}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="variations" className="mt-6" data-tour="variations-section">
                <Suspense fallback={<ModuleLoader />}>
                  <VariationManager
                    projectName={selectedProject.name}
                    projectId={selectedProject.id}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="qa-itp" className="mt-6 space-y-6" data-tour="qa-section">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Quality Assurance / Inspection Test Plan</CardTitle>
                        <p className="text-muted-foreground">
                          Create and track inspection hold points, collect evidence, and generate sign-off records
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={qaActiveTab} onValueChange={setQaActiveTab} className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <TabsList className="grid w-full max-w-md grid-cols-3">
                          <TabsTrigger value="dashboard" className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                          </TabsTrigger>
                          <TabsTrigger value="qa-list" className="flex items-center gap-2">
                            <List className="h-4 w-4" />
                            QA/ITP List
                          </TabsTrigger>
                          <TabsTrigger value="actions" className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" />
                            Action/Task List
                          </TabsTrigger>
                        </TabsList>
                      </div>

                      <TabsContent value="dashboard">
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">QA Dashboard</h3>
                          <p className="text-gray-600">Dashboard view coming soon...</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="qa-list">
                        <Suspense fallback={<ModuleLoader />}>
                          {activeQAForm ? (
                           <QAITPForm 
                              onClose={() => {
                                setActiveQAForm(false);
                                // Don't navigate - just close the form
                              }} 
                              onSuccess={(action) => {
                                // Navigate to QA tracker for both 'create' and 'draft' actions
                                setActiveQAForm(false);
                                setQaActiveTab('qa-list');
                                // Update URL to ensure navigation sticks and URL state matches component state
                                navigate(`/projects?id=${selectedProject.id}&tab=qa-itp`);
                              }}
                              projectId={selectedProject.id}
                            />
                          ) : (
                            <QATrackerOptimized 
                              onNewInspection={() => setActiveQAForm(true)} 
                              projectId={selectedProject.id}
                              onNavigateToTracker={() => {
                                setActiveQAForm(false); // Reset form state
                                setQaActiveTab('qa-list');
                                // Update URL to ensure navigation sticks and URL state matches component state
                                navigate(`/projects?id=${selectedProject.id}&tab=qa-itp`);
                              }}
                            />
                          )}
                        </Suspense>
                      </TabsContent>

                      <TabsContent value="actions">
                        <div className="text-center py-8">
                          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Action/Task List</h3>
                          <p className="text-gray-600">Action and task management coming soon...</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Suspense fallback={<ModuleLoader />}>
                  <DocumentManager 
                    projectName={selectedProject.name}
                  />
                </Suspense>
              </TabsContent>

              <TabsContent value="notes" className="mt-6">
                <Suspense fallback={<ModuleLoader />}>
                  <TeamNotes 
                    projectName={selectedProject.name}
                  />
                </Suspense>
              </TabsContent>

              {canAccess('finance') && (
                <TabsContent value="finance" className="mt-6" data-tour="finance-section">
                  <Suspense fallback={<ModuleLoader />}>
                    <FinanceManager 
                      projectName={selectedProject.name}
                      crossModuleData={crossModuleData}
                    />
                  </Suspense>
                </TabsContent>
              )}
            </Tabs>
            </div>
          </main>
        </div>
      </NavigationErrorBoundary>
    );
  }

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
