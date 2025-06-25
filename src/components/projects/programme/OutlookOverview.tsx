
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, CalendarDays, Target } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';
import { getDaysUntil } from './milestoneUtils';
import { getDaysUntilBadge, getStatusBadge } from './MilestoneBadges';

interface OutlookOverviewProps {
  oneWeekOutlook: ProgrammeMilestone[];
  threeWeekLookAhead: ProgrammeMilestone[];
  allMilestones: ProgrammeMilestone[];
}

const OutlookOverview: React.FC<OutlookOverviewProps> = ({ 
  oneWeekOutlook, 
  threeWeekLookAhead, 
  allMilestones 
}) => {
  // Get key project milestones (high priority or critical milestones)
  const keyMilestones = allMilestones
    .filter(milestone => milestone.priority === 'high' || milestone.status === 'delayed')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Project Milestone Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            Overall Project Milestone Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {keyMilestones.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No critical milestones to highlight</p>
          ) : (
            <div className="space-y-3">
              {keyMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{milestone.milestone_name}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span>{milestone.assigned_to}</span>
                      <span>{milestone.end_date_planned || milestone.planned_date}</span>
                      {milestone.linked_tasks && milestone.linked_tasks.length > 0 && (
                        <span className="text-blue-600">📋 Tasks</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(milestone.status, 0)}
                    {getDaysUntilBadge(getDaysUntil(milestone.end_date_planned || milestone.planned_date))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Outlook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Next 7 Days - Personal Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {oneWeekOutlook.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No personal items due in the next week</p>
            ) : (
              <div className="space-y-2">
                {oneWeekOutlook.slice(0, 3).map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{milestone.milestone_name}</div>
                      <div className="text-xs text-gray-600">{milestone.assigned_to}</div>
                    </div>
                    <div className="text-right">
                      {getDaysUntilBadge(getDaysUntil(milestone.end_date_planned || milestone.planned_date))}
                    </div>
                  </div>
                ))}
                {oneWeekOutlook.length > 3 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500">+{oneWeekOutlook.length - 3} more</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-green-500" />
              Next 3 Weeks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {threeWeekLookAhead.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No milestones due in the next 3 weeks</p>
            ) : (
              <div className="space-y-2">
                {threeWeekLookAhead.slice(0, 4).map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{milestone.milestone_name}</div>
                      <div className="text-xs text-gray-600">{milestone.assigned_to}</div>
                    </div>
                    <div className="text-right">
                      {getDaysUntilBadge(getDaysUntil(milestone.end_date_planned || milestone.planned_date))}
                    </div>
                  </div>
                ))}
                {threeWeekLookAhead.length > 4 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500">+{threeWeekLookAhead.length - 4} more</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OutlookOverview;
