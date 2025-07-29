import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEnhancedTasks, TaskFilters } from '@/hooks/useEnhancedTasks';
import { TaskKanbanBoard } from './TaskKanbanBoard';
import { TaskTableView } from './TaskTableView';
import { TaskDetailsModal } from './TaskDetailsModal';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskNavigationBreadcrumb } from './TaskNavigationBreadcrumb';
import { Task } from '@/hooks/useTasks';
import { Search, Plus, Filter, Users, BarChart3, AlertTriangle, CheckSquare, Clock } from 'lucide-react';

interface EnhancedTaskManagerProps {
  projectId?: string;
  projectName?: string;
  linkedModule?: string;
  showProjectFilter?: boolean;
  title?: string;
}

export const EnhancedTaskManager: React.FC<EnhancedTaskManagerProps> = ({
  projectId,
  projectName,
  linkedModule,
  showProjectFilter = true,
  title,
}) => {
  const [filters, setFilters] = useState<TaskFilters>({
    projectId,
    linkedModule,
  });
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    tasks,
    tasksByStatus,
    overdueTasks,
    taskSummary,
    loading,
    selectedTasks,
    setSelectedTasks,
    createTask,
    createLinkedTask,
    updateTask,
    bulkUpdateTasks,
    refetch,
  } = useEnhancedTasks(filters);

  const handleFilterChange = (key: keyof TaskFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await updateTask(taskId, { status: newStatus });
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    if (linkedModule && projectId) {
      await createLinkedTask(projectId, linkedModule, '', taskData);
    } else {
      await createTask(taskData);
    }
    setShowCreateModal(false);
    refetch();
  };

  const getPageTitle = () => {
    if (title) return title;
    if (linkedModule === 'qa') return 'QA Action Tasks';
    if (projectName) return `${projectName} - Tasks`;
    return 'Task Management';
  };

  const summaryCards = [
    {
      title: 'Total Tasks',
      value: taskSummary.total,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'To Do',
      value: taskSummary.todo,
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'In Progress',
      value: taskSummary.inProgress,
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Completed',
      value: taskSummary.completed,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Overdue',
      value: taskSummary.overdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <TaskNavigationBreadcrumb
        projectId={projectId}
        projectName={projectName}
        linkedModule={linkedModule}
        showGlobalTasksLink={!projectId}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{getPageTitle()}</h2>
          <p className="text-muted-foreground">
            {linkedModule === 'qa' 
              ? 'Quality assurance action items and closeout tasks'
              : 'Manage and track project tasks across all modules'
            }
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className="text-xs text-muted-foreground">{card.title}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority || 'all'} onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
                <SelectItem value="qa">QA</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="variation">Variation</SelectItem>
                <SelectItem value="rfi">RFI</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Content */}
      <Tabs value={viewType} onValueChange={(value) => setViewType(value as 'kanban' | 'list')} className="w-full">
        <TabsList>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-6">
          <TaskKanbanBoard
            tasksByStatus={tasksByStatus}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <TaskTableView
            tasks={tasks}
            selectedTasks={selectedTasks}
            onSelectedTasksChange={setSelectedTasks}
            onTaskClick={handleTaskClick}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        projectId={projectId}
        linkedModule={linkedModule}
      />
    </div>
  );
};