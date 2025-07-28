import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CheckCircle2, Clock, AlertTriangle, Users, Calendar } from 'lucide-react';
import { useEnhancedTasks } from '@/hooks/useEnhancedTasks';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';

interface MilestoneTasksViewProps {
  milestoneId: string;
  milestoneName: string;
  projectId: string;
  projectName: string;
}

export const MilestoneTasksView: React.FC<MilestoneTasksViewProps> = ({
  milestoneId,
  milestoneName,
  projectId,
  projectName
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { 
    tasks: filteredTasks, 
    taskSummary, 
    loading, 
    createLinkedTask, 
    updateTask 
  } = useEnhancedTasks({
    projectId,
    linkedModule: 'milestone',
    linkedId: milestoneId
  });

  const handleCreateTask = async (taskData: any) => {
    const task = await createLinkedTask(
      projectId,
      'milestone',
      milestoneId,
      {
        ...taskData,
        title: taskData.title || `Milestone Task: ${milestoneName}`,
        description: taskData.description || `Task for milestone: ${milestoneName}`,
        category: 'programme',
        reference_number: milestoneName
      }
    );

    if (task) {
      setShowCreateModal(false);
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'todo': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'in-progress': { color: 'bg-blue-100 text-blue-800', icon: Users },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'blocked': { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.todo;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading tasks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Milestone Tasks
          </CardTitle>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Task
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">{taskSummary.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-900">{taskSummary.todo}</div>
              <div className="text-xs text-blue-600">To Do</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-900">{taskSummary.inProgress}</div>
              <div className="text-xs text-yellow-600">In Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-900">{taskSummary.completed}</div>
              <div className="text-xs text-green-600">Completed</div>
            </div>
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No tasks linked to this milestone yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create tasks to track milestone deliverables.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate flex-1">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 ml-2">
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Task #{task.task_number}</span>
                    {task.due_date && (
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredTasks.length > 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  View All {filteredTasks.length} Tasks →
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          projectId={projectId}
          linkedModule="milestone"
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
        />
      )}
    </>
  );
};