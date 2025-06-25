
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Eye, CalendarDays, Upload, Template, BarChart3 } from 'lucide-react';
import { useProgrammeMilestones } from '@/hooks/useProgrammeMilestones';
import { getUpcomingMilestones, sortMilestonesByDate, isWithinDays } from './programme/milestoneUtils';
import MilestoneSummaryCards from './programme/MilestoneSummaryCards';
import MilestoneForm from './programme/MilestoneForm';
import MilestoneTable from './programme/MilestoneTable';
import OutlookOverview from './programme/OutlookOverview';
import WeeklyCalendarView from './programme/WeeklyCalendarView';

interface ProgrammeTrackerProps {
  projectName: string;
  projectId?: string;
}

const ProgrammeTracker: React.FC<ProgrammeTrackerProps> = ({ projectName, projectId }) => {
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { milestones, loading, createMilestone, updateMilestone, deleteMilestone } = useProgrammeMilestones(projectId);

  // Filter milestones for different outlooks
  const oneWeekOutlook = getUpcomingMilestones(milestones, 7).filter(milestone => 
    milestone.priority === 'high' || milestone.critical_path
  );

  const threeWeekLookAhead = getUpcomingMilestones(milestones, 21);
  const sortedMilestones = sortMilestonesByDate(milestones);

  const handleCreateMilestone = async (milestoneData: any) => {
    const success = await createMilestone({
      ...milestoneData,
      project_id: projectId
    });
    
    if (success) {
      setShowNewMilestone(false);
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Programme Tracker</h3>
          <p className="text-gray-600">Track project milestones and delivery schedules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Schedule
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Template className="h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => setShowNewMilestone(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <MilestoneSummaryCards milestones={milestones} />

      {/* Programme Outlook Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
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
          {showNewMilestone && (
            <MilestoneForm 
              showForm={showNewMilestone}
              onCancel={() => setShowNewMilestone(false)}
              onSubmit={handleCreateMilestone}
              projectId={projectId}
            />
          )}

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
  );
};

export default ProgrammeTracker;
