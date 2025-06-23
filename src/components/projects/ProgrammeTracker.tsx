
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Eye, CalendarDays } from 'lucide-react';
import { getSampleMilestones, isWithinDays } from './programme/milestoneUtils';
import MilestoneSummaryCards from './programme/MilestoneSummaryCards';
import MilestoneForm from './programme/MilestoneForm';
import MilestoneTable from './programme/MilestoneTable';
import OutlookOverview from './programme/OutlookOverview';

interface ProgrammeTrackerProps {
  projectName: string;
}

const ProgrammeTracker: React.FC<ProgrammeTrackerProps> = ({ projectName }) => {
  const [showNewMilestone, setShowNewMilestone] = useState(false);

  // Get sample milestones data
  const milestones = getSampleMilestones();

  // Filter milestones for different outlooks
  const oneWeekOutlook = milestones.filter(milestone => 
    milestone.status !== 'complete' && isWithinDays(milestone.dueDate, 7)
  );

  const threeWeekLookAhead = milestones.filter(milestone => 
    milestone.status !== 'complete' && isWithinDays(milestone.dueDate, 21)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Programme Tracker</h3>
          <p className="text-gray-600">Track project milestones and delivery schedules</p>
        </div>
        <Button onClick={() => setShowNewMilestone(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Summary Cards */}
      <MilestoneSummaryCards milestones={milestones} />

      {/* Programme Outlook Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="one-week" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            1 Week Outlook
          </TabsTrigger>
          <TabsTrigger value="three-week" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            3 Week Look Ahead
          </TabsTrigger>
          <TabsTrigger value="all">All Milestones</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OutlookOverview 
            oneWeekOutlook={oneWeekOutlook}
            threeWeekLookAhead={threeWeekLookAhead}
          />
        </TabsContent>

        <TabsContent value="one-week">
          <MilestoneTable
            milestones={oneWeekOutlook}
            title="1 Week Outlook"
            icon={<Eye className="h-5 w-5" />}
            emptyStateIcon={<Calendar className="h-12 w-12" />}
            emptyStateMessage="No milestones due in the next 7 days"
          />
        </TabsContent>

        <TabsContent value="three-week">
          <MilestoneTable
            milestones={threeWeekLookAhead}
            title="3 Week Look Ahead"
            icon={<CalendarDays className="h-5 w-5" />}
            showLinkedModule={true}
            emptyStateIcon={<CalendarDays className="h-12 w-12" />}
            emptyStateMessage="No milestones due in the next 3 weeks"
          />
        </TabsContent>

        <TabsContent value="all">
          <MilestoneForm 
            showForm={showNewMilestone}
            onCancel={() => setShowNewMilestone(false)}
          />

          <MilestoneTable
            milestones={milestones}
            title="All Project Milestones"
            showLinkedModule={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgrammeTracker;
