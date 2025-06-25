
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';
import { getMilestoneStatusColor, getPriorityColor } from './milestoneUtils';

interface GanttChartProps {
  milestones: ProgrammeMilestone[];
  onMilestoneUpdate?: (id: string, updates: Partial<ProgrammeMilestone>) => Promise<boolean>;
}

const GanttChart: React.FC<GanttChartProps> = ({ milestones, onMilestoneUpdate }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewStartDate, setViewStartDate] = useState<Date>(() => {
    const today = new Date();
    const monthsAgo = new Date(today);
    monthsAgo.setMonth(today.getMonth() - 1);
    return monthsAgo;
  });
  const [draggedMilestone, setDraggedMilestone] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Chart dimensions
  const CHART_HEIGHT = 400;
  const ROW_HEIGHT = 40;
  const LEFT_PANEL_WIDTH = 200;
  const DAY_WIDTH = 20 * zoomLevel;
  const TIMELINE_DAYS = 90; // Show 3 months

  // Generate timeline dates
  const generateTimelineDates = () => {
    const dates = [];
    for (let i = 0; i < TIMELINE_DAYS; i++) {
      const date = new Date(viewStartDate);
      date.setDate(viewStartDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const timelineDates = generateTimelineDates();
  const chartWidth = LEFT_PANEL_WIDTH + (TIMELINE_DAYS * DAY_WIDTH);

  // Helper functions
  const getDatePosition = (dateString: string) => {
    const date = new Date(dateString);
    const daysDiff = Math.floor((date.getTime() - viewStartDate.getTime()) / (1000 * 60 * 60 * 24));
    return LEFT_PANEL_WIDTH + (daysDiff * DAY_WIDTH);
  };

  const getMilestoneDuration = (milestone: ProgrammeMilestone) => {
    const startDate = new Date(milestone.start_date_planned || milestone.planned_date);
    const endDate = new Date(milestone.end_date_planned || milestone.planned_date);
    const duration = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    return duration * DAY_WIDTH;
  };

  const getMilestoneColor = (milestone: ProgrammeMilestone) => {
    if (milestone.status === 'complete') return '#10b981'; // green
    if (milestone.status === 'delayed') return '#ef4444'; // red
    if (milestone.critical_path) return '#f59e0b'; // amber
    return '#3b82f6'; // blue
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  };

  // Drag and drop functionality
  const handleMouseDown = (e: React.MouseEvent, milestoneId: string) => {
    if (!onMilestoneUpdate) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedMilestone(milestoneId);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedMilestone || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Calculate new date based on position
    const daysDiff = Math.floor((x - LEFT_PANEL_WIDTH) / DAY_WIDTH);
    const newDate = new Date(viewStartDate);
    newDate.setDate(viewStartDate.getDate() + daysDiff);

    // Visual feedback during drag (you could update a temporary state here)
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!draggedMilestone || !onMilestoneUpdate || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    // Calculate new date
    const daysDiff = Math.floor((x - LEFT_PANEL_WIDTH) / DAY_WIDTH);
    const newDate = new Date(viewStartDate);
    newDate.setDate(viewStartDate.getDate() + daysDiff);

    const milestone = milestones.find(m => m.id === draggedMilestone);
    if (milestone) {
      const newDateString = newDate.toISOString().split('T')[0];
      await onMilestoneUpdate(draggedMilestone, {
        start_date_planned: newDateString,
        planned_date: newDateString
      });
    }

    setDraggedMilestone(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Navigate timeline
  const moveTimelineLeft = () => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() - 7);
    setViewStartDate(newDate);
  };

  const moveTimelineRight = () => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() + 7);
    setViewStartDate(newDate);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Programme Gantt Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={moveTimelineLeft}>
              ←
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={moveTimelineRight}>
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-x-auto overflow-y-auto border rounded-lg">
          <svg
            ref={svgRef}
            width={chartWidth}
            height={Math.max(CHART_HEIGHT, milestones.length * ROW_HEIGHT + 100)}
            className="bg-white"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Timeline Header */}
            <g>
              {timelineDates.map((date, index) => {
                const x = LEFT_PANEL_WIDTH + (index * DAY_WIDTH);
                const isWeekStart = date.getDay() === 1; // Monday
                const isMonthStart = date.getDate() === 1;
                
                return (
                  <g key={date.toISOString()}>
                    {/* Vertical grid lines */}
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={milestones.length * ROW_HEIGHT + 100}
                      stroke={isWeekStart ? "#e5e7eb" : "#f3f4f6"}
                      strokeWidth={isWeekStart ? 1 : 0.5}
                    />
                    
                    {/* Date labels */}
                    {(isWeekStart || isMonthStart) && (
                      <text
                        x={x + 2}
                        y={15}
                        fontSize="10"
                        fill="#6b7280"
                        className="pointer-events-none"
                      >
                        {isMonthStart 
                          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : date.getDate().toString()
                        }
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Left Panel Background */}
            <rect
              x={0}
              y={0}
              width={LEFT_PANEL_WIDTH}
              height={milestones.length * ROW_HEIGHT + 100}
              fill="#f9fafb"
              stroke="#e5e7eb"
            />

            {/* Milestones */}
            {milestones.map((milestone, index) => {
              const y = 30 + (index * ROW_HEIGHT);
              const startDate = milestone.start_date_planned || milestone.planned_date;
              const x = getDatePosition(startDate);
              const width = getMilestoneDuration(milestone);
              const color = getMilestoneColor(milestone);
              
              return (
                <g key={milestone.id}>
                  {/* Row background */}
                  <rect
                    x={0}
                    y={y - 5}
                    width={chartWidth}
                    height={ROW_HEIGHT}
                    fill={index % 2 === 0 ? "#ffffff" : "#f9fafb"}
                    stroke="#f3f4f6"
                  />

                  {/* Milestone name in left panel */}
                  <text
                    x={10}
                    y={y + 15}
                    fontSize="12"
                    fill="#374151"
                    className="pointer-events-none"
                  >
                    {milestone.milestone_name.length > 25 
                      ? milestone.milestone_name.substring(0, 25) + '...'
                      : milestone.milestone_name
                    }
                  </text>

                  {/* Progress indicator */}
                  <text
                    x={10}
                    y={y + 28}
                    fontSize="10"
                    fill="#6b7280"
                    className="pointer-events-none"
                  >
                    {milestone.completion_percentage}% • {milestone.status}
                  </text>

                  {/* Milestone bar */}
                  <rect
                    x={x}
                    y={y + 5}
                    width={Math.max(width, DAY_WIDTH)}
                    height={20}
                    fill={color}
                    opacity={milestone.status === 'complete' ? 0.7 : 0.9}
                    rx={3}
                    className={onMilestoneUpdate ? "cursor-move hover:opacity-100" : ""}
                    onMouseDown={(e) => handleMouseDown(e, milestone.id)}
                  />

                  {/* Progress fill */}
                  <rect
                    x={x}
                    y={y + 5}
                    width={Math.max(width * (milestone.completion_percentage / 100), 0)}
                    height={20}
                    fill={color}
                    opacity={0.8}
                    rx={3}
                    className="pointer-events-none"
                  />

                  {/* Critical path indicator */}
                  {milestone.critical_path && (
                    <rect
                      x={x}
                      y={y + 3}
                      width={Math.max(width, DAY_WIDTH)}
                      height={2}
                      fill="#dc2626"
                      className="pointer-events-none"
                    />
                  )}

                  {/* Delay risk indicator */}
                  {milestone.delay_risk_flag && (
                    <circle
                      cx={x + Math.max(width, DAY_WIDTH) - 5}
                      cy={y + 8}
                      r={3}
                      fill="#f59e0b"
                      className="pointer-events-none"
                    />
                  )}
                </g>
              );
            })}

            {/* Today line */}
            {(() => {
              const todayX = getDatePosition(new Date().toISOString().split('T')[0]);
              return (
                <line
                  x1={todayX}
                  y1={0}
                  x2={todayX}
                  y2={milestones.length * ROW_HEIGHT + 100}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                />
              );
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span>Critical Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 border-2 border-red-600 rounded-full"></div>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttChart;
