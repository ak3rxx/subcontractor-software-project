import { useEffect, useState } from 'react';
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
  
  // Fetch organization settings to check what's enabled
  const [orgSettings, setOrgSettings] = useState<any>(null);
  
  useEffect(() => {
    const fetchOrgSettings = async () => {
      if (!user) return;
      
      try {
        const { data: userOrgs } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1);
          
        if (userOrgs && userOrgs.length > 0) {
          const { data: settings } = await supabase
            .from('organization_settings')
            .select('notification_settings')
            .eq('organization_id', userOrgs[0].organization_id)
            .single();
            
          if (settings?.notification_settings && typeof settings.notification_settings === 'object') {
            const notificationSettings = settings.notification_settings as any;
            if (notificationSettings.auto_task_settings) {
              setOrgSettings(notificationSettings.auto_task_settings);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching org settings:', error);
      }
    };
    
    fetchOrgSettings();
  }, [user]);

  // Auto-create tasks for variations needing approval
  const createVariationApprovalTask = async (variation: any) => {
    if (orgSettings && orgSettings.pending_variations === false) return;
    
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
    if (orgSettings && orgSettings.overdue_rfis === false) return;
    
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
    if (orgSettings && orgSettings.failed_qa_inspections === false) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: inspection.project_id,
          title: `Rectify Failed QA: ${inspection.inspection_number}`,
          description: `QA inspection "${inspection.task_area}" failed. Location: ${inspection.location_reference}. Remedial work required before re-inspection. Trade: ${inspection.trade || 'Not specified'}.`,
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

  // Auto-create tasks for approved variations (site completion)
  const createApprovedVariationTask = async (variation: any) => {
    if (orgSettings && orgSettings.approved_variations === false) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: variation.project_id,
          title: `Complete Approved Variation: ${variation.variation_number}`,
          description: `Variation "${variation.title}" has been approved. Execute variation work on site. Approved amount: $${variation.total_amount}. Location: ${variation.location || 'Not specified'}.`,
          status: 'todo',
          priority: 'medium',
          category: 'variation',
          linked_module: 'variation',
          linked_id: variation.id,
          reference_number: variation.variation_number,
          created_by: user?.id,
          assigned_to: variation.requested_by || user?.id,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days from now
        });

      if (error) throw error;

      toast({
        title: "Task Auto-Created",
        description: `Site completion task created for approved variation ${variation.variation_number}`,
      });
    } catch (error) {
      console.error('Error creating approved variation task:', error);
    }
  };

  // Auto-create tasks for new construction milestones (material planning)
  const createMaterialPlanningTask = async (milestone: any) => {
    if (orgSettings && orgSettings.construction_milestones === false) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: milestone.project_id,
          title: `Material Planning: ${milestone.milestone_name}`,
          description: `New construction milestone "${milestone.milestone_name}" requires material planning. Verify materials are ordered and scheduled for delivery. Planned date: ${milestone.planned_date}.`,
          status: 'todo',
          priority: 'high',
          category: 'programme',
          linked_module: 'milestone',
          linked_id: milestone.id,
          reference_number: milestone.reference_number,
          created_by: user?.id,
          assigned_to: milestone.assigned_to || user?.id,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
        });

      if (error) throw error;

      toast({
        title: "Task Auto-Created",
        description: `Material planning task created for milestone ${milestone.milestone_name}`,
      });
    } catch (error) {
      console.error('Error creating material planning task:', error);
    }
  };

  // Auto-create tasks for delayed milestones
  const createDelayedMilestoneTask = async (milestone: any) => {
    if (orgSettings && orgSettings.delayed_milestones === false) return;
    
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

  // Event-based real-time triggers for auto-task creation
  useEffect(() => {
    if (!enabled || !user || !projectId) return;

    // Real-time subscription for QA inspection updates
    const qaChannel = supabase
      .channel(`qa_auto_tasks_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'qa_inspections',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Check if status changed to failed
          if (newRecord.overall_status === 'failed' && oldRecord.overall_status !== 'failed') {
            console.log('QA inspection failed, creating rectification task:', newRecord.inspection_number);
            
            // Check if task already exists
            const { data: existingTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('linked_module', 'qa')
              .eq('linked_id', newRecord.id)
              .eq('category', 'qa')
              .single();
              
            if (!existingTask) {
              createFailedQATask(newRecord);
            }
          }
        }
      )
      .subscribe();

    // Real-time subscription for variation updates
    const variationChannel = supabase
      .channel(`variation_auto_tasks_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'variations',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Check if variation was approved
          if (newRecord.status === 'approved' && oldRecord.status !== 'approved') {
            console.log('Variation approved, creating site completion task:', newRecord.variation_number);
            
            // Check if task already exists
            const { data: existingTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('linked_module', 'variation')
              .eq('linked_id', newRecord.id)
              .eq('category', 'variation')
              .eq('title', `Complete Approved Variation: ${newRecord.variation_number}`)
              .single();
              
            if (!existingTask) {
              createApprovedVariationTask(newRecord);
            }
          }
          
          // Check if variation needs approval
          if (newRecord.status === 'pending_approval' && oldRecord.status !== 'pending_approval') {
            console.log('Variation needs approval, creating approval task:', newRecord.variation_number);
            
            const { data: existingTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('linked_module', 'variation')
              .eq('linked_id', newRecord.id)
              .eq('category', 'variation')
              .eq('title', `Approve Variation: ${newRecord.variation_number}`)
              .single();
              
            if (!existingTask) {
              createVariationApprovalTask(newRecord);
            }
          }
        }
      )
      .subscribe();

    // Real-time subscription for milestone creation
    const milestoneChannel = supabase
      .channel(`milestone_auto_tasks_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'programme_milestones',
          filter: `project_id=eq.${projectId}`
        },
        async (payload) => {
          const newRecord = payload.new as any;
          
          // Check if it's a construction-related milestone
          const constructionKeywords = ['construct', 'build', 'install', 'erect', 'frame', 'concrete', 'steel'];
          const isConstructionMilestone = constructionKeywords.some(keyword => 
            newRecord.milestone_name?.toLowerCase().includes(keyword) ||
            newRecord.description?.toLowerCase().includes(keyword)
          );
          
          if (isConstructionMilestone) {
            console.log('Construction milestone created, creating material planning task:', newRecord.milestone_name);
            
            // Check if task already exists
            const { data: existingTask } = await supabase
              .from('tasks')
              .select('id')
              .eq('linked_module', 'milestone')
              .eq('linked_id', newRecord.id)
              .eq('category', 'programme')
              .single();
              
            if (!existingTask) {
              createMaterialPlanningTask(newRecord);
            }
          }
        }
      )
      .subscribe();

    // Initial check for existing conditions
    const checkExistingConditions = async () => {
      try {
        // Check for existing failed QA inspections
        const { data: failedInspections } = await supabase
          .from('qa_inspections')
          .select('*')
          .eq('project_id', projectId)
          .eq('overall_status', 'failed');

        // Check for existing approved variations without completion tasks
        const { data: approvedVariations } = await supabase
          .from('variations')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'approved');

        // Check for pending approval variations
        const { data: pendingVariations } = await supabase
          .from('variations')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'pending_approval');

        // Check for overdue RFIs
        const { data: overdueRfis } = await supabase
          .from('rfis')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'open')
          .lt('due_date', new Date().toISOString().split('T')[0]);

        // Get existing tasks to avoid duplicates
        const { data: existingTasks } = await supabase
          .from('tasks')
          .select('linked_id, linked_module, category, title')
          .eq('project_id', projectId);

        const existingTaskKeys = new Set(existingTasks?.map(t => 
          `${t.linked_module}-${t.linked_id}-${t.category}`
        ) || []);

        // Create tasks for failed QA inspections
        failedInspections?.forEach(inspection => {
          const taskKey = `qa-${inspection.id}-qa`;
          if (!existingTaskKeys.has(taskKey)) {
            createFailedQATask(inspection);
          }
        });

        // Create tasks for approved variations
        approvedVariations?.forEach(variation => {
          const taskKey = `variation-${variation.id}-variation`;
          const hasCompletionTask = existingTasks?.some(t => 
            t.linked_id === variation.id && 
            t.linked_module === 'variation' && 
            t.title?.includes('Complete Approved Variation')
          );
          if (!hasCompletionTask) {
            createApprovedVariationTask(variation);
          }
        });

        // Create tasks for pending variations
        pendingVariations?.forEach(variation => {
          const hasApprovalTask = existingTasks?.some(t => 
            t.linked_id === variation.id && 
            t.linked_module === 'variation' && 
            t.title?.includes('Approve Variation')
          );
          if (!hasApprovalTask) {
            createVariationApprovalTask(variation);
          }
        });

        // Create tasks for overdue RFIs
        overdueRfis?.forEach(rfi => {
          const taskKey = `rfi-${rfi.id}-rfi`;
          if (!existingTaskKeys.has(taskKey)) {
            createOverdueRFITask(rfi);
          }
        });

      } catch (error) {
        console.error('Error checking existing conditions:', error);
      }
    };

    // Run initial check
    checkExistingConditions();

    return () => {
      supabase.removeChannel(qaChannel);
      supabase.removeChannel(variationChannel);
      supabase.removeChannel(milestoneChannel);
    };
  }, [enabled, user, projectId]);

  return {
    createVariationApprovalTask,
    createOverdueRFITask,
    createFailedQATask,
    createDelayedMilestoneTask,
    createApprovedVariationTask,
    createMaterialPlanningTask
  };
};