
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, CalendarDays } from 'lucide-react';
import { Milestone, getDaysUntil } from './milestoneUtils';
import { getDaysUntilBadge } from './MilestoneBadges';

interface OutlookOverviewProps {
  oneWeekOutlook: Milestone[];
  threeWeekLookAhead: Milestone[];
}

const OutlookOverview: React.FC<OutlookOverviewProps> = ({ oneWeekOutlook, threeWeekLookAhead }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            Next 7 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {oneWeekOutlook.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No milestones due in the next week</p>
          ) : (
            <div className="space-y-2">
              {oneWeekOutlook.slice(0, 3).map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{milestone.name}</div>
                    <div className="text-xs text-gray-600">{milestone.assignedTo}</div>
                  </div>
                  <div className="text-right">
                    {getDaysUntilBadge(getDaysUntil(milestone.dueDate))}
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
                    <div className="font-medium text-sm">{milestone.name}</div>
                    <div className="text-xs text-gray-600">{milestone.assignedTo}</div>
                  </div>
                  <div className="text-right">
                    {getDaysUntilBadge(getDaysUntil(milestone.dueDate))}
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
  );
};

export default OutlookOverview;
