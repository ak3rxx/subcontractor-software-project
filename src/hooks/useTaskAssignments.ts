import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TaskAssignment {
  id: string;
  task_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  user_name?: string;
  user_email?: string;
}

export const useTaskAssignments = (taskId: string) => {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAssignments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          *,
          profiles!task_assignments_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('task_id', taskId);

      if (error) throw error;

      const formattedAssignments = data?.map(assignment => ({
        ...assignment,
        user_name: assignment.profiles?.full_name || assignment.profiles?.email || 'Unknown User',
        user_email: assignment.profiles?.email
      })) || [];

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error('Error fetching task assignments:', error);
      toast({
        title: "Error",
        description: "Failed to load task assignments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, toast]);

  const addAssignment = useCallback(async (userId: string) => {
    if (!taskId || !userId) return false;

    try {
      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          user_id: userId,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      await fetchAssignments();
      toast({
        title: "Success",
        description: "User assigned to task"
      });
      return true;
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive"
      });
      return false;
    }
  }, [taskId, fetchAssignments, toast]);

  const removeAssignment = useCallback(async (userId: string) => {
    if (!taskId || !userId) return false;

    try {
      const { error } = await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchAssignments();
      toast({
        title: "Success",
        description: "User removed from task"
      });
      return true;
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive"
      });
      return false;
    }
  }, [taskId, fetchAssignments, toast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    addAssignment,
    removeAssignment,
    refetch: fetchAssignments
  };
};