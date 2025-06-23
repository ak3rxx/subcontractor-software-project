
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Milestone, getDaysUntil } from './milestoneUtils';
import { getDaysUntilBadge } from './MilestoneBadges';

interface WeeklyCalendarViewProps {
  milestones: Milestone[];
}

const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({ milestones }) => {
  // Get the current week (Monday to Sunday)
  const getWeekDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust for Sunday being 0
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Group milestones by date
  const getMilestonesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return milestones.filter(milestone => milestone.dueDate === dateString);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Next 7 Days - Weekly Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayMilestones = getMilestonesForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={index}
                className={`border rounded-lg p-3 min-h-[120px] ${
                  isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-gray-600">
                    {dayNames[index]}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {day.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="text-xs p-2 bg-white rounded border border-gray-200 shadow-sm"
                    >
                      <div className="font-medium truncate" title={milestone.name}>
                        {milestone.name}
                      </div>
                      <div className="text-gray-600 truncate" title={milestone.assignedTo}>
                        {milestone.assignedTo}
                      </div>
                      <div className="mt-1">
                        {getDaysUntilBadge(getDaysUntil(milestone.dueDate))}
                      </div>
                    </div>
                  ))}
                  {dayMilestones.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">
                      No milestones
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyCalendarView;
