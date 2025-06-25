
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';
import { getMilestoneStatusColor, calculateDaysUntilDue } from './milestoneUtils';

interface TimelineViewProps {
  milestones: ProgrammeMilestone[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ milestones }) => {
  // Sort milestones by date
  const sortedMilestones = [...milestones].sort((a, b) => {
    const dateA = new Date(a.start_date_planned || a.planned_date);
    const dateB = new Date(b.start_date_planned || b.planned_date);
    return dateA.getTime() - dateB.getTime();
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilText = (milestone: ProgrammeMilestone) => {
    const dueDate = milestone.end_date_planned || milestone.planned_date;
    if (!dueDate || milestone.status === 'complete') return null;
    
    const days = calculateDaysUntilDue(dueDate);
    
    if (days < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-xs">
          <AlertTriangle className="h-3 w-3" />
          {Math.abs(days)} days overdue
        </div>
      );
    } else if (days === 0) {
      return <div className="text-orange-600 text-xs font-medium">Due today</div>;
    } else if (days <= 7) {
      return <div className="text-yellow-600 text-xs font-medium">{days} days left</div>;
    }
    
    return <div className="text-gray-600 text-xs">{days} days left</div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          Programme Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {sortedMilestones.map((milestone, index) => (
              <div key={milestone.id} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  milestone.status === 'complete' ? 'bg-green-500 border-green-500' :
                  milestone.status === 'delayed' ? 'bg-red-500 border-red-500' :
                  milestone.critical_path ? 'bg-amber-500 border-amber-500' :
                  'bg-blue-500 border-blue-500'
                }`}>
                  {milestone.status === 'complete' && (
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  )}
                </div>

                {/* Milestone content */}
                <div className="flex-1 min-h-16">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{milestone.milestone_name}</h4>
                        {milestone.critical_path && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            Critical
                          </Badge>
                        )}
                      </div>
                      
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {milestone.start_date_planned && milestone.end_date_planned ? (
                            <span>
                              {formatDate(milestone.start_date_planned)} - {formatDate(milestone.end_date_planned)}
                            </span>
                          ) : (
                            <span>{formatDate(milestone.planned_date)}</span>
                          )}
                        </div>
                        
                        {milestone.assigned_to && (
                          <span>Assigned to: {milestone.assigned_to}</span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${milestone.completion_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 min-w-12">
                          {milestone.completion_percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <Badge className={getMilestoneStatusColor(milestone.status)} variant="secondary">
                        {milestone.status.replace('-', ' ')}
                      </Badge>
                      <div className="mt-1">
                        {getDaysUntilText(milestone)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sortedMilestones.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Milestones</h3>
              <p className="text-gray-600">Add milestones to see your project timeline</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineView;
