import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, User, Calendar, ArrowRight } from 'lucide-react';
import { useEnhancedTasks } from '@/hooks/useEnhancedTasks';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal';
import { useState } from 'react';

interface VariationTasksViewProps {
  variationId: string;
  variationNumber: string;
  projectId: string;
  projectName: string;
}

export const VariationTasksView: React.FC<VariationTasksViewProps> = ({
  variationId,
  variationNumber,
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
    projectId: projectId,
    linkedModule: 'variation'
  });

  const handleCreateTask = async (taskData: any): Promise<void> => {
    try {
      await createLinkedTask(
        projectId,
        'variation',
        variationId,
        taskData
      );
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'todo': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⏸' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⏳' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
      'blocked': { bg: 'bg-red-100', text: 'text-red-800', icon: '🚫' }
    }[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '❓' };

    return (
      <Badge className={`${config.bg} ${config.text} text-xs`}>
        {config.icon} {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      'high': { bg: 'bg-red-100', text: 'text-red-800' },
      'medium': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'low': { bg: 'bg-green-100', text: 'text-green-800' }
    }[priority] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
      <Badge className={`${config.bg} ${config.text} text-xs`}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading related tasks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Related Tasks
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Tasks linked to variation {variationNumber}
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Task Summary */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{taskSummary.total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{taskSummary.todo}</div>
              <div className="text-xs text-gray-600">To Do</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{taskSummary.inProgress}</div>
              <div className="text-xs text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{taskSummary.completed}</div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm">No related tasks found</p>
              <p className="text-xs text-gray-400 mt-1">
                Create a task to track work related to this variation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {task.assigned_to && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assignee_name || 'Assigned'}
                          </div>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                  </div>
                </div>
              ))}

              {filteredTasks.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all {filteredTasks.length} tasks
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        projectId={projectId}
        linkedModule="variation"
      />

      {selectedTask && (
        <TaskDetailsModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onUpdate={updateTask}
        />
      )}
    </>
  );
};