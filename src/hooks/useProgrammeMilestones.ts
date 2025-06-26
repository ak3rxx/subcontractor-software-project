import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type MilestoneRow = Database['public']['Tables']['programme_milestones']['Row'];
type MilestoneInsert = Database['public']['Tables']['programme_milestones']['Insert'];
type MilestoneUpdate = Database['public']['Tables']['programme_milestones']['Update'];

export interface ProgrammeMilestone {
  id: string;
  project_id?: string;
  milestone_name: string;
  description?: string;
  start_date_planned?: string;
  end_date_planned?: string;
  start_date_actual?: string;
  end_date_actual?: string;
  planned_date: string; // Keep for backward compatibility
  actual_date?: string;
  status: 'upcoming' | 'in-progress' | 'complete' | 'delayed';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  assigned_to?: string;
  completion_percentage: number;
  critical_path: boolean;
  delay_risk_flag: boolean;
  linked_tasks: string[];
  linked_itps: string[];
  linked_deliveries: string[];
  linked_handovers: string[];
  dependencies: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useProgrammeMilestones = (projectId?: string) => {
  const [milestones, setMilestones] = useState<ProgrammeMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMilestones = async () => {
    if (!user) {
      console.log('No user found, skipping milestone fetch');
      setLoading(false);
      return;
    }

    console.log('Fetching milestones for user:', user.id, 'project:', projectId);

    try {
      let query = supabase
        .from('programme_milestones')
        .select('*')
        .order('start_date_planned', { ascending: true });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      console.log('Supabase query result:', { data, error, projectId });

      if (error) {
        console.error('Error fetching milestones:', error);
        toast({
          title: "Database Error",
          description: `Failed to load programme milestones: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      const transformedMilestones: ProgrammeMilestone[] = (data || []).map((milestone: MilestoneRow) => ({
        id: milestone.id,
        project_id: milestone.project_id || undefined,
        milestone_name: milestone.milestone_name,
        description: milestone.description || undefined,
        start_date_planned: milestone.start_date_planned || undefined,
        end_date_planned: milestone.end_date_planned || undefined,
        start_date_actual: milestone.start_date_actual || undefined,
        end_date_actual: milestone.end_date_actual || undefined,
        planned_date: milestone.planned_date,
        actual_date: milestone.actual_date || undefined,
        status: milestone.status as ProgrammeMilestone['status'] || 'upcoming',
        priority: milestone.priority as ProgrammeMilestone['priority'] || 'medium',
        category: milestone.category || undefined,
        assigned_to: milestone.assigned_to || undefined,
        completion_percentage: milestone.completion_percentage || 0,
        critical_path: milestone.critical_path || false,
        delay_risk_flag: milestone.delay_risk_flag || false,
        linked_tasks: milestone.linked_tasks || [],
        linked_itps: milestone.linked_itps || [],
        linked_deliveries: milestone.linked_deliveries || [],
        linked_handovers: milestone.linked_handovers || [],
        dependencies: milestone.dependencies || [],
        notes: milestone.notes || undefined,
        created_at: milestone.created_at || '',
        updated_at: milestone.updated_at || '',
      }));

      console.log('Transformed milestones:', transformedMilestones);
      setMilestones(transformedMilestones);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load programme milestones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMilestone = async (milestoneData: Partial<ProgrammeMilestone>) => {
    if (!user) {
      console.error('No user found for milestone creation');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create milestones",
        variant: "destructive"
      });
      return null;
    }

    console.log('Creating milestone with data:', milestoneData);
    console.log('User context:', user);

    try {
      const insertData: MilestoneInsert = {
        project_id: milestoneData.project_id,
        milestone_name: milestoneData.milestone_name || '',
        description: milestoneData.description,
        start_date_planned: milestoneData.start_date_planned,
        end_date_planned: milestoneData.end_date_planned,
        planned_date: milestoneData.planned_date || milestoneData.start_date_planned || new Date().toISOString().split('T')[0],
        status: milestoneData.status || 'upcoming',
        priority: milestoneData.priority || 'medium',
        category: milestoneData.category,
        assigned_to: milestoneData.assigned_to,
        completion_percentage: milestoneData.completion_percentage || 0,
        critical_path: milestoneData.critical_path || false,
        delay_risk_flag: milestoneData.delay_risk_flag || false,
        linked_tasks: milestoneData.linked_tasks || [],
        linked_itps: milestoneData.linked_itps || [],
        linked_deliveries: milestoneData.linked_deliveries || [],
        linked_handovers: milestoneData.linked_handovers || [],
        dependencies: milestoneData.dependencies || [],
        notes: milestoneData.notes,
      };

      console.log('Insert data prepared:', insertData);

      const { data, error } = await supabase
        .from('programme_milestones')
        .insert(insertData)
        .select()
        .single();

      console.log('Supabase insert result:', { data, error });

      if (error) {
        console.error('Error creating milestone:', error);
        toast({
          title: "Database Error",
          description: `Failed to create milestone: ${error.message}`,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success",
        description: "Milestone created successfully"
      });

      await fetchMilestones();
      return data;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while creating the milestone",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateMilestone = async (id: string, updates: Partial<ProgrammeMilestone>) => {
    try {
      const updateData: MilestoneUpdate = {
        milestone_name: updates.milestone_name,
        description: updates.description,
        start_date_planned: updates.start_date_planned,
        end_date_planned: updates.end_date_planned,
        start_date_actual: updates.start_date_actual,
        end_date_actual: updates.end_date_actual,
        planned_date: updates.planned_date,
        actual_date: updates.actual_date,
        status: updates.status,
        priority: updates.priority,
        category: updates.category,
        assigned_to: updates.assigned_to,
        completion_percentage: updates.completion_percentage,
        critical_path: updates.critical_path,
        delay_risk_flag: updates.delay_risk_flag,
        linked_tasks: updates.linked_tasks,
        linked_itps: updates.linked_itps,
        linked_deliveries: updates.linked_deliveries,
        linked_handovers: updates.linked_handovers,
        dependencies: updates.dependencies,
        notes: updates.notes,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('programme_milestones')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating milestone:', error);
        toast({
          title: "Error",
          description: "Failed to update milestone",
          variant: "destructive"
        });
        return false;
      }

      await fetchMilestones();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const deleteMilestone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('programme_milestones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting milestone:', error);
        toast({
          title: "Error",
          description: "Failed to delete milestone",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "Milestone deleted successfully"
      });

      await fetchMilestones();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('useProgrammeMilestones effect triggered:', { user: user?.id, projectId });
    fetchMilestones();
  }, [user, projectId]);

  return {
    milestones,
    loading,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    refetch: fetchMilestones
  };
};
