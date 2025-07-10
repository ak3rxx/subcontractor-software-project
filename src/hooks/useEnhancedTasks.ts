import { useEffect } from 'react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useEnhancedTasks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tasks: serverTasks, loading, createTask: serverCreateTask, updateTask: serverUpdateTask, refetch } = useTasks();
  
  const {
    items: tasks,
    pendingActions,
    isPerformingAction,
    performOptimisticAction,
    updateItems,
    getPendingAction,
    hasPendingAction
  } = useOptimisticUpdates<Task>(serverTasks, 'tasks');

  // Update local state when server data changes
  useEffect(() => {
    updateItems(serverTasks);
  }, [serverTasks, updateItems]);

  const createTask = async (taskData: Partial<Task>): Promise<Task | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    // Create optimistic task
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      title: taskData.title || '',
      description: taskData.description || '',
      project_id: taskData.project_id,
      project_name: taskData.project_name,
      assigned_to: taskData.assigned_to || user.id,
      assignee_name: taskData.assignee_name,
      created_by: user.id,
      priority: 'medium',
      status: 'todo',
      due_date: taskData.due_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return performOptimisticAction(
      'create',
      optimisticTask,
      async () => {
        const result = await serverCreateTask(taskData);
        return optimisticTask; // Return our properly typed task
      },
      {
        successMessage: `Task "${optimisticTask.title}" created successfully`,
        errorMessage: 'Failed to create task'
      }
    );
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const existingTask = tasks.find(t => t.id === id);
    if (!existingTask) return null;

    const updatedTask = { 
      ...existingTask, 
      ...updates, 
      updated_at: new Date().toISOString(),
      completed_date: updates.status === 'completed' ? new Date().toISOString().split('T')[0] : existingTask.completed_date
    };

    return performOptimisticAction(
      'update',
      updatedTask,
      async () => {
        const success = await serverUpdateTask(id, updates);
        if (!success) throw new Error('Failed to update task');
        return updatedTask;
      },
      {
        successMessage: `Task "${existingTask.title}" updated successfully`,
        errorMessage: 'Failed to update task'
      }
    );
  };

  const changeTaskStatus = async (id: string, newStatus: Task['status']): Promise<Task | null> => {
    const existingTask = tasks.find(t => t.id === id);
    if (!existingTask) return null;

    return updateTask(id, { 
      status: newStatus,
      completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
    });
  };

  const assignTask = async (id: string, assignedTo: string, assigneeName?: string): Promise<Task | null> => {
    return updateTask(id, { 
      assigned_to: assignedTo,
      assignee_name: assigneeName
    });
  };

  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>): Promise<void> => {
    if (taskIds.length === 0) return;

    // Perform optimistic updates for all tasks
    const optimisticTasks = taskIds.map(id => {
      const existingTask = tasks.find(t => t.id === id);
      return existingTask ? { ...existingTask, ...updates, updated_at: new Date().toISOString() } : null;
    }).filter(Boolean) as Task[];

    // Apply all optimistic updates
    for (const task of optimisticTasks) {
      performOptimisticAction(
        'update',
        task,
        async () => {
          const success = await serverUpdateTask(task.id, updates);
          if (!success) throw new Error(`Failed to update task ${task.id}`);
          return task;
        },
        {
          skipToast: true
        }
      );
    }

    toast({
      title: "Success",
      description: `${taskIds.length} task(s) updated successfully`
    });
  };

  // Get status info for UI
  const getTaskStatusInfo = (taskId: string) => {
    const pendingAction = getPendingAction(taskId);
    const isUpdating = hasPendingAction(taskId);
    
    let statusMessage = '';
    if (pendingAction) {
      switch (pendingAction.type) {
        case 'create':
          statusMessage = 'Creating...';
          break;
        case 'update':
          statusMessage = 'Updating...';
          break;
        case 'status-change':
          statusMessage = `Changing status...`;
          break;
        case 'delete':
          statusMessage = 'Deleting...';
          break;
      }
    }

    return {
      isUpdating,
      statusMessage,
      pendingAction
    };
  };

  // Get summary with optimistic updates
  const getTaskSummary = () => {
    const todo = tasks.filter(t => t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < new Date() && 
      t.status !== 'completed'
    ).length;

    return { todo, inProgress, completed, overdue, total: tasks.length };
  };

  return {
    tasks,
    loading,
    isPerformingAction,
    pendingActions,
    createTask,
    updateTask,
    changeTaskStatus,
    assignTask,
    bulkUpdateTasks,
    getTaskStatusInfo,
    getTaskSummary,
    hasPendingAction,
    refetch
  };
};