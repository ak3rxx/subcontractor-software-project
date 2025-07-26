import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Task, useTasks } from '@/hooks/useTasks';

export interface TaskFilters {
  projectId?: string;
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  linkedModule?: string;
}

export interface TaskSummary {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  blocked: number;
  overdue: number;
}

export const useEnhancedTasks = (filters?: TaskFilters) => {
  const { tasks, loading, createTask, updateTask, refetch } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // Enhanced filtered tasks based on filters
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter(task => {
      if (filters?.projectId && task.project_id !== filters.projectId) return false;
      if (filters?.status && task.status !== filters.status) return false;
      if (filters?.category && task.category !== filters.category) return false;
      if (filters?.priority && task.priority !== filters.priority) return false;
      if (filters?.assignedTo && task.assigned_to !== filters.assignedTo) return false;
      if (filters?.linkedModule && task.linked_module !== filters.linkedModule) return false;
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.task_number?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [tasks, filters]);

  // Task summary for dashboard
  const taskSummary = useMemo((): TaskSummary => {
    const today = new Date();
    
    return {
      total: filteredTasks.length,
      todo: filteredTasks.filter(t => t.status === 'todo').length,
      inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      blocked: filteredTasks.filter(t => t.status === 'blocked').length,
      overdue: filteredTasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < today && 
        t.status !== 'completed'
      ).length,
    };
  }, [filteredTasks]);

  // Enhanced create task with auto-generation of task number
  const createEnhancedTask = async (taskData: Partial<Task>) => {
    if (!user) return null;

    try {
      const enhancedTaskData = {
        ...taskData,
        category: taskData.category || 'general',
        created_by: user.id,
      };

      return await createTask(enhancedTaskData);
    } catch (error) {
      console.error('Error creating enhanced task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
      return null;
    }
  };

  // Bulk update tasks
  const bulkUpdateTasks = async (taskIds: string[], updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .in('id', taskIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${taskIds.length} tasks`
      });

      await refetch();
      setSelectedTasks([]);
    } catch (error) {
      console.error('Error bulk updating tasks:', error);
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive"
      });
    }
  };

  // Create task from cross-module (Variation, RFI, etc.)
  const createLinkedTask = async (
    projectId: string,
    linkedModule: string,
    linkedId: string,
    taskData: Partial<Task>
  ) => {
    const linkedTaskData = {
      ...taskData,
      project_id: projectId,
      linked_module: linkedModule,
      linked_id: linkedId,
      category: linkedModule.toLowerCase() as Task['category'],
    };

    return await createEnhancedTask(linkedTaskData);
  };

  // Group tasks by status for Kanban view
  const tasksByStatus = useMemo(() => {
    return {
      todo: filteredTasks.filter(t => t.status === 'todo'),
      'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
      completed: filteredTasks.filter(t => t.status === 'completed'),
      blocked: filteredTasks.filter(t => t.status === 'blocked'),
    };
  }, [filteredTasks]);

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    const today = new Date();
    return filteredTasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < today && 
      t.status !== 'completed'
    );
  }, [filteredTasks]);

  return {
    tasks: filteredTasks,
    tasksByStatus,
    overdueTasks,
    taskSummary,
    loading,
    selectedTasks,
    setSelectedTasks,
    createTask: createEnhancedTask,
    createLinkedTask,
    updateTask,
    bulkUpdateTasks,
    refetch,
  };
};