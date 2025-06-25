
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  project_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  created_by?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  due_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(name),
          assigned_profile:profiles!tasks_assigned_to_fkey(full_name, email),
          created_profile:profiles!tasks_created_by_fkey(full_name, email)
        `)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }

      const transformedTasks: Task[] = (data || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        project_id: task.project_id,
        project_name: task.projects?.name,
        assigned_to: task.assigned_to,
        assignee_name: task.assigned_profile?.full_name || task.assigned_profile?.email,
        created_by: task.created_by,
        priority: task.priority as Task['priority'],
        status: task.status as Task['status'],
        due_date: task.due_date,
        completed_date: task.completed_date,
        created_at: task.created_at,
        updated_at: task.updated_at,
      }));

      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Partial<Task>) => {
    if (!user) return null;

    try {
      const insertData: TaskInsert = {
        title: taskData.title || '',
        description: taskData.description,
        project_id: taskData.project_id,
        assigned_to: taskData.assigned_to || user.id,
        created_by: user.id,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        due_date: taskData.due_date,
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        toast({
          title: "Error",
          description: "Failed to create task",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Task created successfully"
      });

      await fetchTasks(); // Refresh tasks
      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          priority: updates.priority,
          status: updates.status,
          due_date: updates.due_date,
          completed_date: updates.status === 'completed' ? new Date().toISOString().split('T')[0] : null,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating task:', error);
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive"
        });
        return false;
      }

      await fetchTasks(); // Refresh tasks
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    refetch: fetchTasks
  };
};
