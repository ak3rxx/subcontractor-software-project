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
        .select('*')
        .eq('task_id', taskId);

      if (error) throw error;

      // Get user details separately
      const userIds = data?.map(assignment => assignment.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const formattedAssignments = data?.map(assignment => {
        const profile = profiles?.find(p => p.id === assignment.user_id);
        return {
          ...assignment,
          user_name: profile?.full_name || profile?.email || 'Unknown User',
          user_email: profile?.email
        };
      }) || [];

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