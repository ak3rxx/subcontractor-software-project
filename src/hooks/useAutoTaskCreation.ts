import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AutoTaskCreationOptions {
  enabled?: boolean;
  projectId?: string;
}

export const useAutoTaskCreation = (options: AutoTaskCreationOptions = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { enabled = true, projectId } = options;

  // Auto-create tasks for variations needing approval
  const createVariationApprovalTask = async (variation: any) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: variation.project_id,
          title: `Approve Variation: ${variation.variation_number}`,
          description: `Variation "${variation.title}" requires approval. Cost impact: $${variation.total_amount}`,
          status: 'todo',
          priority: variation.priority === 'high' ? 'high' : 'medium',
          category: 'variation',
          linked_module: 'variation',
          linked_id: variation.id,
          reference_number: variation.variation_number,
          created_by: user?.id,
          assigned_to: variation.approved_by || user?.id,
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 5 days from now
        });

      if (error) throw error;

      toast({
        title: "Task Auto-Created",
        description: `Approval task created for variation ${variation.variation_number}`,
      });
    } catch (error) {
      console.error('Error creating variation approval task:', error);
    }
  };

  // Auto-create tasks for overdue RFIs
  const createOverdueRFITask = async (rfi: any) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: rfi.project_id,
          title: `Follow-up Overdue RFI: ${rfi.rfi_number}`,
          description: `RFI "${rfi.title}" is overdue. Due date was ${rfi.due_date}. Please follow up for response.`,
          status: 'todo',
          priority: 'high',
          category: 'rfi',
          linked_module: 'rfi',
          linked_id: rfi.id,
          reference_number: rfi.rfi_number,
          created_by: user?.id,
          assigned_to: rfi.submitted_by || user?.id,
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 days from now
        });

      if (error) throw error;

      toast({
        title: "Task Auto-Created",
        description: `Follow-up task created for overdue RFI ${rfi.rfi_number}`,
      });
    } catch (error) {
      console.error('Error creating overdue RFI task:', error);
    }
  };

  // Auto-create tasks for failed QA inspections
  const createFailedQATask = async (inspection: any) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: inspection.project_id,
          title: `Rectify Failed QA: ${inspection.inspection_number}`,
          description: `QA inspection "${inspection.task_area}" failed. Remedial work required before re-inspection.`,
          status: 'todo',
          priority: 'high',
          category: 'qa',
          linked_module: 'qa',
          linked_id: inspection.id,
          reference_number: inspection.inspection_number,
          created_by: user?.id,
          assigned_to: inspection.created_by || user?.id,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days from now
        });

      if (error) throw error;

      toast({
        title: "Task Auto-Created",
        description: `Rectification task created for failed QA ${inspection.inspection_number}`,
      });
    } catch (error) {
      console.error('Error creating failed QA task:', error);
    }
  };

  // Auto-create tasks for delayed milestones
  const createDelayedMilestoneTask = async (milestone: any) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: milestone.project_id,
          title: `Address Delayed Milestone: ${milestone.milestone_name}`,
          description: `Milestone "${milestone.milestone_name}" is behind schedule. Review and create recovery plan.`,
          status: 'todo',
          priority: milestone.critical_path ? 'high' : 'medium',
          category: 'programme',
          linked_module: 'milestone',
          linked_id: milestone.id,
          reference_number: milestone.reference_number,
          created_by: user?.id,
          assigned_to: milestone.assigned_to || user?.id,
          due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 day from now
        });

      if (error) throw error;

      toast({
        title: "Task Auto-Created",
        description: `Recovery task created for delayed milestone ${milestone.milestone_name}`,
      });
    } catch (error) {
      console.error('Error creating delayed milestone task:', error);
    }
  };

  // Check for conditions that trigger auto-task creation
  useEffect(() => {
    if (!enabled || !user || !projectId) return;

    const checkAutoTaskConditions = async () => {
      try {
        // Check for variations needing approval
        const { data: variations } = await supabase
          .from('variations')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'pending_approval')
          .is('approved_by', null);

        // Check for overdue RFIs
        const { data: rfis } = await supabase
          .from('rfis')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'open')
          .lt('due_date', new Date().toISOString().split('T')[0]);

        // Check for failed QA inspections
        const { data: inspections } = await supabase
          .from('qa_inspections')
          .select('*')
          .eq('project_id', projectId)
          .eq('overall_status', 'failed');

        // Check for delayed milestones
        const { data: milestones } = await supabase
          .from('programme_milestones')
          .select('*')
          .eq('project_id', projectId)
          .eq('delay_risk_flag', true);

        // Check if tasks already exist for these items
        const existingTasksQuery = supabase
          .from('tasks')
          .select('linked_id, linked_module')
          .eq('project_id', projectId);

        const { data: existingTasks } = await existingTasksQuery;
        const existingTaskIds = new Set(existingTasks?.map(t => `${t.linked_module}-${t.linked_id}`) || []);

        // Create tasks for items that don't already have them
        variations?.forEach(variation => {
          if (!existingTaskIds.has(`variation-${variation.id}`)) {
            createVariationApprovalTask(variation);
          }
        });

        rfis?.forEach(rfi => {
          if (!existingTaskIds.has(`rfi-${rfi.id}`)) {
            createOverdueRFITask(rfi);
          }
        });

        inspections?.forEach(inspection => {
          if (!existingTaskIds.has(`qa-${inspection.id}`)) {
            createFailedQATask(inspection);
          }
        });

        milestones?.forEach(milestone => {
          if (!existingTaskIds.has(`milestone-${milestone.id}`)) {
            createDelayedMilestoneTask(milestone);
          }
        });

      } catch (error) {
        console.error('Error checking auto-task conditions:', error);
      }
    };

    // Check immediately and then every 5 minutes
    checkAutoTaskConditions();
    const interval = setInterval(checkAutoTaskConditions, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, user, projectId]);

  return {
    createVariationApprovalTask,
    createOverdueRFITask,
    createFailedQATask,
    createDelayedMilestoneTask
  };
};