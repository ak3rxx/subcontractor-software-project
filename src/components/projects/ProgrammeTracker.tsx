
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Eye, CalendarDays, Upload, FileText, BarChart3, Clock, GitBranch, AlertCircle, Brain } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProgrammeMilestones } from '@/hooks/useProgrammeMilestones';
import { useProgrammeAI } from '@/hooks/useProgrammeAI';
import { getUpcomingMilestones, sortMilestonesByDate } from './programme/milestoneUtils';
import MilestoneSummaryCards from './programme/MilestoneSummaryCards';
import MilestoneForm from './programme/MilestoneForm';
import MilestoneTable from './programme/MilestoneTable';
import OutlookOverview from './programme/OutlookOverview';
import WeeklyCalendarView from './programme/WeeklyCalendarView';
import GanttChart from './programme/GanttChart';
import TimelineView from './programme/TimelineView';
import ProgrammeDocumentUpload from './programme/ProgrammeDocumentUpload';
import ProgrammeAIAssistant from './programme/ProgrammeAIAssistant';
import { useSearchParams } from 'react-router-dom';
import { useAutoTaskCreation } from '@/hooks/useAutoTaskCreation';
import { MilestoneTasksView } from './programme/MilestoneTasksView';

interface ProgrammeTrackerProps {
  projectName: string;
  projectId?: string;
  crossModuleData?: any;
}

const ProgrammeTracker: React.FC<ProgrammeTrackerProps> = ({ projectName, projectId, crossModuleData }) => {
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { milestones, loading, createMilestone, updateMilestone, deleteMilestone } = useProgrammeMilestones(projectId);
  const aiHook = useProgrammeAI(projectId || '');
  
  // Enable auto-task creation for milestones
  useAutoTaskCreation({ enabled: true, projectId });

  // Handle cross-module navigation and auto-form opening
  useEffect(() => {
    const action = searchParams.get('action');
    const data = searchParams.get('data');
    
    if (action === 'create-milestone' && data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        console.log('Auto-opening milestone form with data:', parsedData);
        setShowNewMilestone(true);
      } catch (error) {
        console.error('Error parsing cross-module data:', error);
      }
    }
  }, [searchParams]);

  console.log('ProgrammeTracker render:', { projectId, milestonesCount: milestones.length, loading });

  // Filter milestones for different outlooks
  const oneWeekOutlook = getUpcomingMilestones(milestones, 7).filter(milestone => 
    milestone.priority === 'high' || milestone.critical_path
  );

  const threeWeekLookAhead = getUpcomingMilestones(milestones, 21);
  const sortedMilestones = sortMilestonesByDate(milestones);

  const handleCreateMilestone = async (milestoneData: any) => {
    console.log('handleCreateMilestone called with:', milestoneData);
    
    if (!projectId) {
      console.error('No project ID available for milestone creation');
      return;
    }
    
    const success = await createMilestone({
      ...milestoneData,
      project_id: projectId
    });
    
    console.log('createMilestone result:', success);
    
    if (success) {
      setShowNewMilestone(false);
      // Clear search params after successful creation
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('action');
      newSearchParams.delete('data');
      setSearchParams(newSearchParams);
      console.log('Milestone created successfully, form closed');
    } else {
      console.error('Failed to create milestone');
    }
  };

  // Handle AI-generated milestones
  const handleCreateAIMilestones = async (milestones: any[]) => {
    if (!projectId) return;
    
    console.log('Creating AI-generated milestones:', milestones);
    
    const results = await Promise.all(
      milestones.map(milestone => createMilestone({
        ...milestone,
        project_id: projectId,
        milestone_name: milestone.name,
        description: milestone.description,
        trade: milestone.trade,
        priority: milestone.priority || 'medium',
        status: 'upcoming'
      }))
    );
    
    const successCount = results.filter(Boolean).length;
    console.log(`Created ${successCount} out of ${milestones.length} AI milestones`);
  };

  // Handle AI suggestion application
  const handleApplySuggestion = async (suggestion: any) => {
    console.log('Applying AI suggestion:', suggestion);
    
    switch (suggestion.suggestion_type) {
      case 'milestone_creation':
        if (suggestion.suggestion_data.milestones) {
          await handleCreateAIMilestones(suggestion.suggestion_data.milestones);
        }
        break;
      case 'sequence_suggestion':
        // Handle sequence application logic here
        console.log('Applied sequence suggestion:', suggestion.suggestion_data);
        break;
      default:
        console.log('Applied generic suggestion:', suggestion.suggestion_data);
    }
  };

  // Parse cross-module data for form auto-population
  const getCrossModuleFormData = () => {
    const data = searchParams.get('data');
    if (data) {
      try {
        return JSON.parse(decodeURIComponent(data));
      } catch (error) {
        console.error('Error parsing cross-module data:', error);
        return null;
      }
    }
    return crossModuleData;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Programme Tracker</h3>
            <p className="text-gray-600">Track project milestones and delivery schedules</p>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading programme data...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Programme Tracker</h3>
            <p className="text-gray-600">Track project milestones and delivery schedules</p>
            {projectId && <p className="text-sm text-gray-500">Project ID: {projectId}</p>}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowDocumentUpload(!showDocumentUpload)}
            >
              <Upload className="h-4 w-4" />
              Upload Schedule
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => {
                    console.log('Add Milestone button clicked');
                    setShowNewMilestone(true);
                  }} 
                  className="flex items-center gap-2"
                  disabled={!projectId}
                >
                  <Plus className="h-4 w-4" />
                  Add Milestone
                  {!projectId && <AlertCircle className="h-4 w-4 ml-1" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!projectId ? 'No project selected - cannot create milestones' : 'Create a new milestone'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Document Upload Section */}
        {showDocumentUpload && projectId && (
          <ProgrammeDocumentUpload
            projectId={projectId}
            onDocumentParsed={aiHook.handleDocumentParsed}
          />
        )}

        {/* AI Assistant */}
        {projectId && aiHook.parsedDocuments.length > 0 && (
          <ProgrammeAIAssistant
            projectId={projectId}
            parsedDocuments={aiHook.parsedDocuments}
            onApplySuggestion={handleApplySuggestion}
            onCreateMilestones={handleCreateAIMilestones}
          />
        )}

        {/* Show form when requested */}
        {showNewMilestone && (
          <MilestoneForm 
            showForm={showNewMilestone}
            onCancel={() => {
              console.log('Form cancelled');
              setShowNewMilestone(false);
              // Clear search params when cancelling
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.delete('action');
              newSearchParams.delete('data');
              setSearchParams(newSearchParams);
            }}
            onSubmit={handleCreateMilestone}
            projectId={projectId}
            crossModuleData={getCrossModuleFormData()}
          />
        )}

        {/* Summary Cards */}
        <MilestoneSummaryCards milestones={milestones} />

        {/* Milestone Tasks View for first milestone (demo) */}
        {milestones.length > 0 && projectId && (
          <MilestoneTasksView
            milestoneId={milestones[0].id}
            milestoneName={milestones[0].milestone_name}
            projectId={projectId}
            projectName={projectName}
          />
        )}

        {/* Programme Outlook Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Gantt Chart
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="planner" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              3 Week Planner
            </TabsTrigger>
            <TabsTrigger value="one-week" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              1 Week Outlook
            </TabsTrigger>
            <TabsTrigger value="programme" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Full Programme
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OutlookOverview 
              oneWeekOutlook={oneWeekOutlook}
              threeWeekLookAhead={threeWeekLookAhead}
              allMilestones={milestones}
            />
          </TabsContent>

          <TabsContent value="ai-insights" className="space-y-4">
            {projectId ? (
              <>
                <ProgrammeDocumentUpload
                  projectId={projectId}
                  onDocumentParsed={aiHook.handleDocumentParsed}
                />
                <ProgrammeAIAssistant
                  projectId={projectId}
                  parsedDocuments={aiHook.parsedDocuments}
                  onApplySuggestion={handleApplySuggestion}
                  onCreateMilestones={handleCreateAIMilestones}
                />
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Select a project to use AI-powered programme building features.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gantt" className="space-y-4">
            <GanttChart 
              milestones={milestones}
              onMilestoneUpdate={updateMilestone}
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <TimelineView milestones={milestones} />
          </TabsContent>

          <TabsContent value="planner" className="space-y-4">
            <WeeklyCalendarView milestones={threeWeekLookAhead} />
            
            <MilestoneTable
              milestones={threeWeekLookAhead}
              title="3 Week Look Ahead"
              icon={<CalendarDays className="h-5 w-5" />}
              showLinkedModule={true}
              emptyStateIcon={<CalendarDays className="h-12 w-12" />}
              emptyStateMessage="No milestones due in the next 3 weeks"
              onUpdate={updateMilestone}
              onDelete={deleteMilestone}
            />
          </TabsContent>

          <TabsContent value="one-week">
            <MilestoneTable
              milestones={oneWeekOutlook}
              title="1 Week Outlook - Critical Items"
              icon={<Eye className="h-5 w-5" />}
              emptyStateIcon={<Calendar className="h-12 w-12" />}
              emptyStateMessage="No critical milestones due in the next 7 days"
              onUpdate={updateMilestone}
              onDelete={deleteMilestone}
            />
          </TabsContent>

          <TabsContent value="programme">
            <MilestoneTable
              milestones={sortedMilestones}
              title="Complete Project Programme"
              showLinkedModule={true}
              onUpdate={updateMilestone}
              onDelete={deleteMilestone}
              emptyStateIcon={<CalendarDays className="h-12 w-12" />}
              emptyStateMessage="No milestones created yet. Add your first milestone to get started."
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ProgrammeTracker;
