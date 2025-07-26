import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/hooks/useTasks';
import { TaskLinkedBadge } from './TaskLinkedBadge';
import { Calendar, User, Building, Link2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface TaskKanbanBoardProps {
  tasksByStatus: {
    todo: Task[];
    'in-progress': Task[];
    completed: Task[];
    blocked: Task[];
  };
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: Task['status']) => void;
}

const statusConfig = {
  todo: { title: 'To Do', color: 'bg-muted', textColor: 'text-muted-foreground' },
  'in-progress': { title: 'In Progress', color: 'bg-blue-100', textColor: 'text-blue-800' },
  completed: { title: 'Completed', color: 'bg-green-100', textColor: 'text-green-800' },
  blocked: { title: 'Blocked', color: 'bg-red-100', textColor: 'text-red-800' },
};

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasksByStatus,
  onTaskClick,
  onStatusChange,
}) => {
  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'default'}>{priority}</Badge>;
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    
    const variants = {
      qa: 'default',
      trade: 'secondary',
      admin: 'outline',
      variation: 'destructive',
      rfi: 'default',
    } as const;
    
    return <Badge variant={variants[category as keyof typeof variants] || 'outline'}>{category}</Badge>;
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
              {task.task_number && (
                <p className="text-xs text-muted-foreground mt-1">{task.task_number}</p>
              )}
            </div>
            {getPriorityBadge(task.priority)}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            {getCategoryBadge(task.category)}
            <TaskLinkedBadge task={task} />
            {isOverdue(task.due_date, task.status) && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-3">
              {task.due_date && (
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(task.due_date), 'MMM dd')}
                </div>
              )}
              {task.assignee_name && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {task.assignee_name}
                </div>
              )}
            </div>
            {task.project_name && (
              <div className="flex items-center">
                <Building className="w-3 h-3 mr-1" />
                <span className="truncate max-w-20">{task.project_name}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1">
            {Object.keys(statusConfig).map((status) => {
              if (status === task.status) return null;
              return (
                <Button
                  key={status}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.id, status as Task['status']);
                  }}
                >
                  Move to {statusConfig[status as keyof typeof statusConfig].title}
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(statusConfig).map(([status, config]) => (
        <div key={status} className="space-y-4">
          <Card className={`${config.color} border-none`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-sm font-medium ${config.textColor}`}>
                {config.title}
                <Badge variant="secondary" className="ml-2">
                  {tasksByStatus[status as keyof typeof tasksByStatus].length}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {tasksByStatus[status as keyof typeof tasksByStatus].map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {tasksByStatus[status as keyof typeof tasksByStatus].length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No {config.title.toLowerCase()} tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};