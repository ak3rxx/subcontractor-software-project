
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  status: 'todo' | 'in-progress' | 'completed' | 'blocked' | 'delayed' | 'overdue';
  due_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
  category?: string;
  linked_module?: string;
  linked_id?: string;
  attachments?: any[];
  comments?: string;
  task_number?: string;
  reference_number?: string;
  url_link?: string;
  drawing_number?: string;
  location?: string;
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Tasks: Fetching tasks for user:', user.id);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects(name),
          assigned_profile:profiles!tasks_assigned_to_fkey(full_name, email),
          created_profile:profiles!tasks_created_by_fkey(full_name, email)
        `)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Error",
          description: "Failed to fetch tasks",
          variant: "destructive"
        });
        setTasks([]);
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
        category: task.category,
        linked_module: task.linked_module,
        linked_id: task.linked_id,
        attachments: task.attachments || [],
        comments: task.comments,
        task_number: task.task_number,
        reference_number: task.reference_number,
        url_link: task.url_link,
        drawing_number: task.drawing_number,
        location: task.location,
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
        assigned_to: taskData.assigned_to === '' ? null : (taskData.assigned_to || user.id),
        created_by: user.id,
        priority: taskData.priority || 'medium',
        status: taskData.status || 'todo',
        due_date: taskData.due_date,
        category: taskData.category || 'general',
        linked_module: taskData.linked_module,
        linked_id: taskData.linked_id,
        reference_number: taskData.reference_number,
        comments: taskData.comments,
        url_link: taskData.url_link,
        drawing_number: taskData.drawing_number,
        location: taskData.location,
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
          comments: updates.comments,
          url_link: updates.url_link,
          drawing_number: updates.drawing_number,
          location: updates.location,
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
    console.log('Tasks: Effect triggered for user:', user?.id);
    fetchTasks();
  }, [user?.id]);

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    refetch: fetchTasks
  };
};
