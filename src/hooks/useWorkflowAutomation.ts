import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSmartNotifications } from './useSmartNotifications';
import { useToast } from '@/hooks/use-toast';

interface WorkflowRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    module: string;
    event: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'notify' | 'create' | 'update' | 'assign' | 'escalate';
    params: Record<string, any>;
  }>;
}

const defaultWorkflowRules: WorkflowRule[] = [
  {
    id: 'qa-failure-to-variation',
    name: 'QA Failure → Create Variation',
    enabled: true,
    trigger: {
      module: 'qa_inspections',
      event: 'INSERT',
      conditions: { overall_status: 'failed' }
    },
    actions: [
      {
        type: 'notify',
        params: {
          title: 'QA Failure Detected',
          message: 'Failed QA inspection may require variation. Consider creating one.',
          priority: 'high'
        }
      }
    ]
  },
  {
    id: 'variation-approved-update-budget',
    name: 'Variation Approved → Update Budget',
    enabled: true,
    trigger: {
      module: 'variations',
      event: 'UPDATE',
      conditions: { status: 'approved' }
    },
    actions: [
      {
        type: 'notify',
        params: {
          title: 'Budget Update Required',
          message: 'Approved variation requires budget adjustment.',
          priority: 'medium'
        }
      }
    ]
  },
  {
    id: 'task-overdue-escalation',
    name: 'Task Overdue → Escalate',
    enabled: true,
    trigger: {
      module: 'tasks',
      event: 'SCHEDULE_CHECK',
      conditions: { days_overdue: 3 }
    },
    actions: [
      {
        type: 'escalate',
        params: {
          escalation_level: 'project_manager',
          message: 'Task has been overdue for 3+ days'
        }
      }
    ]
  },
  {
    id: 'budget-overrun-warning',
    name: 'Budget Overrun → Create RFI',
    enabled: true,
    trigger: {
      module: 'finance',
      event: 'BUDGET_CHECK',
      conditions: { overrun_percentage: 15 }
    },
    actions: [
      {
        type: 'notify',
        params: {
          title: 'Budget Overrun Alert',
          message: 'Consider creating RFI for budget clarification.',
          priority: 'high'
        }
      }
    ]
  }
];

export const useWorkflowAutomation = () => {
  const { addNotification } = useSmartNotifications();
  const { toast } = useToast();

  const executeWorkflowAction = useCallback(async (action: WorkflowRule['actions'][0], context: any) => {
    try {
      switch (action.type) {
        case 'notify':
          addNotification({
            type: context.type || 'info',
            priority: action.params.priority || 'medium',
            title: action.params.title,
            message: action.params.message,
            moduleSource: 'automation',
            relatedId: context.relatedId,
            actionable: action.params.actionable || false,
            actions: action.params.actions
          });
          break;

        case 'create':
          // Auto-create related records (e.g., RFI from QA failure)
          if (action.params.table === 'rfis' && context.qaInspection) {
            const { error } = await supabase
              .from('rfis')
              .insert({
                project_id: context.qaInspection.project_id,
                rfi_number: `QA-${context.qaInspection.inspection_number}`,
                title: `Quality Issue: ${context.qaInspection.task_area}`,
                description: `QA inspection ${context.qaInspection.inspection_number} failed. Requires clarification.`,
                priority: 'high',
                status: 'open',
                submitted_by: context.qaInspection.created_by
              });

            if (!error) {
              addNotification({
                type: 'success',
                priority: 'medium',
                title: 'RFI Created Automatically',
                message: `RFI created for QA failure in ${context.qaInspection.task_area}`,
                moduleSource: 'automation',
                actionable: true,
                actions: [{
                  label: 'View RFI',
                  action: () => window.location.href = '/projects?tab=rfis'
                }]
              });
            }
          }
          break;

        case 'update':
          // Auto-update related records
          if (action.params.table && action.params.updates && context.recordId) {
            await supabase
              .from(action.params.table)
              .update(action.params.updates)
              .eq('id', context.recordId);
          }
          break;

        case 'assign':
          // Auto-assign tasks based on conditions
          if (context.task && action.params.assigneeRule) {
            const { data: projectTeam } = await supabase
              .from('organization_users')
              .select('user_id, role')
              .eq('organization_id', context.organizationId)
              .eq('status', 'active');

            const assignee = projectTeam?.find(member => 
              member.role === action.params.assigneeRule.role
            );

            if (assignee) {
              await supabase
                .from('tasks')
                .update({ assigned_to: assignee.user_id })
                .eq('id', context.task.id);

              addNotification({
                type: 'info',
                priority: 'low',
                title: 'Task Auto-Assigned',
                message: `Task "${context.task.title}" assigned automatically`,
                moduleSource: 'automation',
                actionable: false
              });
            }
          }
          break;

        case 'escalate':
          // Send escalation notifications
          addNotification({
            type: 'warning',
            priority: 'high',
            title: 'Escalation Required',
            message: action.params.message,
            moduleSource: 'automation',
            relatedId: context.relatedId,
            actionable: true,
            actions: [{
              label: 'Review Issue',
              action: () => {
                // Navigate to the relevant module/item
                const moduleMap: Record<string, string> = {
                  'tasks': 'tasks',
                  'variations': 'variations',
                  'qa_inspections': 'qa',
                  'rfis': 'rfis'
                };
                const tab = moduleMap[context.module] || 'dashboard';
                window.location.href = `/projects?tab=${tab}`;
              }
            }]
          });
          break;
      }
    } catch (error) {
      console.error('Error executing workflow action:', error);
      toast({
        title: 'Automation Error',
        description: 'Failed to execute automated action',
        variant: 'destructive'
      });
    }
  }, [addNotification, toast]);

  const checkWorkflowRules = useCallback(async (module: string, event: string, record: any, oldRecord?: any) => {
    const applicableRules = defaultWorkflowRules.filter(rule => 
      rule.enabled && 
      rule.trigger.module === module && 
      rule.trigger.event === event
    );

    for (const rule of applicableRules) {
      let conditionsMet = true;

      // Check trigger conditions
      for (const [key, expectedValue] of Object.entries(rule.trigger.conditions)) {
        const actualValue = record[key];
        
        if (key === 'status' && event === 'UPDATE') {
          // For status changes, check if it changed TO the expected value
          conditionsMet = actualValue === expectedValue && oldRecord?.[key] !== expectedValue;
        } else {
          conditionsMet = actualValue === expectedValue;
        }

        if (!conditionsMet) break;
      }

      if (conditionsMet) {
        // Execute all actions for this rule
        for (const action of rule.actions) {
          await executeWorkflowAction(action, {
            module,
            event,
            record,
            oldRecord,
            relatedId: record.id,
            qaInspection: module === 'qa_inspections' ? record : undefined,
            task: module === 'tasks' ? record : undefined
          });
        }
      }
    }
  }, [executeWorkflowAction]);

  // Set up real-time workflow monitoring
  useEffect(() => {
    const channels = [
      // Monitor QA inspections for automation triggers
      supabase
        .channel('workflow-qa')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'qa_inspections'
        }, (payload) => {
          checkWorkflowRules('qa_inspections', 'INSERT', payload.new);
        })
        .subscribe(),

      // Monitor variation status changes
      supabase
        .channel('workflow-variations')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'variations'
        }, (payload) => {
          checkWorkflowRules('variations', 'UPDATE', payload.new, payload.old);
        })
        .subscribe(),

      // Monitor task updates
      supabase
        .channel('workflow-tasks')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks'
        }, (payload) => {
          checkWorkflowRules('tasks', 'UPDATE', payload.new, payload.old);
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [checkWorkflowRules]);

  // Periodic checks for schedule-based triggers (e.g., overdue tasks)
  useEffect(() => {
    const runScheduledChecks = async () => {
      try {
        // Check for overdue tasks
        const { data: overdueTasks } = await supabase
          .from('tasks')
          .select('*')
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed');

        overdueTasks?.forEach(task => {
          const daysOverdue = Math.floor(
            (Date.now() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysOverdue >= 3) {
            checkWorkflowRules('tasks', 'SCHEDULE_CHECK', {
              ...task,
              days_overdue: daysOverdue
            });
          }
        });

        // Check for budget overruns
        const { data: projects } = await supabase
          .from('projects')
          .select(`
            *,
            variations!inner(cost_impact)
          `);

        projects?.forEach(project => {
          const totalVariationCost = project.variations?.reduce(
            (sum: number, v: any) => sum + (v.cost_impact || 0), 0
          ) || 0;
          
          const overrunPercentage = project.total_budget > 0 
            ? (totalVariationCost / project.total_budget) * 100 
            : 0;

          if (overrunPercentage >= 15) {
            checkWorkflowRules('finance', 'BUDGET_CHECK', {
              ...project,
              overrun_percentage: overrunPercentage
            });
          }
        });

      } catch (error) {
        console.error('Error in scheduled workflow checks:', error);
      }
    };

    // Run checks every hour
    const interval = setInterval(runScheduledChecks, 60 * 60 * 1000);
    runScheduledChecks(); // Initial run

    return () => clearInterval(interval);
  }, [checkWorkflowRules]);

  return {
    rules: defaultWorkflowRules,
    executeWorkflowAction,
    checkWorkflowRules
  };
};