import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  name: string;
  trigger: 'milestone_completed' | 'qa_passed' | 'variation_approved' | 'task_completed';
  conditions: {
    milestoneId?: string;
    trade?: string;
    zone?: string;
    priority?: string;
  };
  actions: {
    createTask?: {
      title: string;
      description: string;
      assigneeRole: string;
      priority: 'low' | 'medium' | 'high';
      dueDate?: string; // relative, e.g., "+7 days"
    };
    updateMilestone?: {
      milestoneId: string;
      status: string;
      actualEndDate?: string;
    };
    sendNotification?: {
      recipients: string[];
      message: string;
    };
    calculateVariationImpact?: {
      updateProgramme: boolean;
      recalculateDates: boolean;
    };
  };
  isActive: boolean;
}

interface WorkflowEvent {
  type: 'milestone_completed' | 'qa_passed' | 'variation_approved' | 'task_completed';
  data: any;
  projectId: string;
  userId: string;
}

export const useAdvancedWorkflowAutomation = (projectId: string) => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eventQueue, setEventQueue] = useState<WorkflowEvent[]>([]);
  const { toast } = useToast();

  // Load automation rules for project
  useEffect(() => {
    if (projectId) {
      loadAutomationRules();
    }
  }, [projectId]);

  const loadAutomationRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('workflow_automation_rules')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) throw error;

      setAutomationRules(data || []);
    } catch (error) {
      console.error('Error loading automation rules:', error);
    }
  }, [projectId]);

  // Process workflow event
  const processWorkflowEvent = useCallback(async (event: WorkflowEvent) => {
    setIsProcessing(true);
    setEventQueue(prev => [...prev, event]);

    try {
      // Find matching automation rules
      const matchingRules = automationRules.filter(rule => 
        rule.trigger === event.type && 
        rule.isActive &&
        checkConditions(rule.conditions, event.data)
      );

      console.log(`Processing ${event.type} event, found ${matchingRules.length} matching rules`);

      // Execute actions for each matching rule
      for (const rule of matchingRules) {
        await executeAutomationActions(rule.actions, event);
        
        // Log automation execution
        await supabase
          .from('workflow_automation_logs')
          .insert({
            project_id: projectId,
            rule_id: rule.id,
            event_type: event.type,
            event_data: event.data,
            executed_at: new Date().toISOString(),
            user_id: event.userId
          });
      }

      if (matchingRules.length > 0) {
        toast({
          title: "Workflow Automation",
          description: `Executed ${matchingRules.length} automation rule(s) for ${event.type}`,
        });
      }

    } catch (error) {
      console.error('Error processing workflow event:', error);
      toast({
        title: "Automation Error",
        description: "Failed to execute workflow automation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setEventQueue(prev => prev.filter(e => e !== event));
    }
  }, [automationRules, projectId, toast]);

  // Check if event data matches rule conditions
  const checkConditions = (conditions: any, eventData: any): boolean => {
    if (conditions.milestoneId && eventData.milestoneId !== conditions.milestoneId) {
      return false;
    }
    if (conditions.trade && eventData.trade !== conditions.trade) {
      return false;
    }
    if (conditions.zone && eventData.zone !== conditions.zone) {
      return false;
    }
    if (conditions.priority && eventData.priority !== conditions.priority) {
      return false;
    }
    return true;
  };

  // Execute automation actions
  const executeAutomationActions = async (actions: any, event: WorkflowEvent) => {
    // Create task if specified
    if (actions.createTask) {
      await createAutomatedTask(actions.createTask, event);
    }

    // Update milestone if specified
    if (actions.updateMilestone) {
      await updateMilestoneAutomatically(actions.updateMilestone, event);
    }

    // Send notification if specified
    if (actions.sendNotification) {
      await sendAutomatedNotification(actions.sendNotification, event);
    }

    // Calculate variation impact if specified
    if (actions.calculateVariationImpact) {
      await calculateVariationImpactAutomatically(actions.calculateVariationImpact, event);
    }
  };

  // Create automated task
  const createAutomatedTask = async (taskConfig: any, event: WorkflowEvent) => {
    try {
      // Calculate due date if relative
      let dueDate = null;
      if (taskConfig.dueDate) {
        const match = taskConfig.dueDate.match(/^\+(\d+)\s+days?$/);
        if (match) {
          const days = parseInt(match[1]);
          dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + days);
        }
      }

      // Find assignee based on role
      const { data: assignee } = await supabase
        .from('project_team_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('role', taskConfig.assigneeRole)
        .limit(1)
        .single();

      const { error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: taskConfig.title,
          description: `${taskConfig.description}\n\nAutomatically created from ${event.type} event.`,
          assigned_to: assignee?.user_id,
          priority: taskConfig.priority,
          due_date: dueDate?.toISOString(),
          status: 'todo',
          category: 'automated',
          created_by: event.userId,
          automation_source: {
            trigger: event.type,
            sourceData: event.data
          }
        });

      if (error) throw error;

      console.log('Created automated task:', taskConfig.title);

    } catch (error) {
      console.error('Error creating automated task:', error);
    }
  };

  // Update milestone automatically
  const updateMilestoneAutomatically = async (milestoneConfig: any, event: WorkflowEvent) => {
    try {
      const updates: any = {
        status: milestoneConfig.status,
        updated_at: new Date().toISOString()
      };

      if (milestoneConfig.actualEndDate === 'now') {
        updates.actual_end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('programme_milestones')
        .update(updates)
        .eq('id', milestoneConfig.milestoneId)
        .eq('project_id', projectId);

      if (error) throw error;

      console.log('Updated milestone automatically:', milestoneConfig.milestoneId);

    } catch (error) {
      console.error('Error updating milestone automatically:', error);
    }
  };

  // Send automated notification
  const sendAutomatedNotification = async (notificationConfig: any, event: WorkflowEvent) => {
    try {
      const notifications = notificationConfig.recipients.map((recipient: string) => ({
        user_id: recipient,
        project_id: projectId,
        type: 'workflow_automation',
        title: 'Automated Workflow Action',
        message: notificationConfig.message,
        data: {
          trigger: event.type,
          sourceData: event.data
        },
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      console.log('Sent automated notifications to:', notificationConfig.recipients.length, 'recipients');

    } catch (error) {
      console.error('Error sending automated notification:', error);
    }
  };

  // Calculate variation impact automatically
  const calculateVariationImpactAutomatically = async (impactConfig: any, event: WorkflowEvent) => {
    try {
      if (event.type === 'variation_approved' && impactConfig.updateProgramme) {
        // Get variation details
        const { data: variation, error: variationError } = await supabase
          .from('variations')
          .select('*')
          .eq('id', event.data.variationId)
          .single();

        if (variationError) throw variationError;

        // Update affected milestones based on variation impact
        if (variation.time_impact_days && variation.time_impact_days > 0) {
          const { data: milestones, error: milestonesError } = await supabase
            .from('programme_milestones')
            .select('*')
            .eq('project_id', projectId)
            .gte('planned_start_date', variation.created_at);

          if (milestonesError) throw milestonesError;

          // Update milestone dates
          for (const milestone of milestones) {
            const newStartDate = new Date(milestone.planned_start_date);
            const newEndDate = new Date(milestone.planned_end_date);
            
            newStartDate.setDate(newStartDate.getDate() + variation.time_impact_days);
            newEndDate.setDate(newEndDate.getDate() + variation.time_impact_days);

            await supabase
              .from('programme_milestones')
              .update({
                planned_start_date: newStartDate.toISOString(),
                planned_end_date: newEndDate.toISOString(),
                notes: `Updated due to variation impact: ${variation.title}`
              })
              .eq('id', milestone.id);
          }

          console.log('Updated programme dates due to variation impact');
        }
      }

    } catch (error) {
      console.error('Error calculating variation impact:', error);
    }
  };

  // Trigger specific automation events
  const triggerMilestoneCompleted = useCallback((milestoneData: any, userId: string) => {
    processWorkflowEvent({
      type: 'milestone_completed',
      data: milestoneData,
      projectId,
      userId
    });
  }, [processWorkflowEvent, projectId]);

  const triggerQAPassed = useCallback((qaData: any, userId: string) => {
    processWorkflowEvent({
      type: 'qa_passed',
      data: qaData,
      projectId,
      userId
    });
  }, [processWorkflowEvent, projectId]);

  const triggerVariationApproved = useCallback((variationData: any, userId: string) => {
    processWorkflowEvent({
      type: 'variation_approved',
      data: variationData,
      projectId,
      userId
    });
  }, [processWorkflowEvent, projectId]);

  const triggerTaskCompleted = useCallback((taskData: any, userId: string) => {
    processWorkflowEvent({
      type: 'task_completed',
      data: taskData,
      projectId,
      userId
    });
  }, [processWorkflowEvent, projectId]);

  // Create new automation rule
  const createAutomationRule = useCallback(async (rule: Omit<AutomationRule, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('workflow_automation_rules')
        .insert({
          ...rule,
          project_id: projectId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setAutomationRules(prev => [...prev, data]);
      
      toast({
        title: "Automation Rule Created",
        description: `"${rule.name}" automation rule has been created`
      });

      return data;

    } catch (error) {
      console.error('Error creating automation rule:', error);
      toast({
        title: "Error",
        description: "Failed to create automation rule",
        variant: "destructive"
      });
      return null;
    }
  }, [projectId, toast]);

  // Get automation insights
  const getAutomationInsights = useCallback(async () => {
    try {
      const { data: logs, error } = await supabase
        .from('workflow_automation_logs')
        .select(`
          *,
          workflow_automation_rules (name, trigger)
        `)
        .eq('project_id', projectId)
        .order('executed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate insights
      const totalExecutions = logs.length;
      const uniqueRules = new Set(logs.map(log => log.rule_id)).size;
      const recentExecutions = logs.filter(log => {
        const executedAt = new Date(log.executed_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return executedAt >= weekAgo;
      }).length;

      const triggerStats = logs.reduce((acc, log) => {
        const trigger = log.workflow_automation_rules?.trigger || 'unknown';
        acc[trigger] = (acc[trigger] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalExecutions,
        uniqueRules,
        recentExecutions,
        triggerStats,
        recentLogs: logs.slice(0, 10)
      };

    } catch (error) {
      console.error('Error getting automation insights:', error);
      return null;
    }
  }, [projectId]);

  return {
    automationRules,
    isProcessing,
    eventQueue,
    processWorkflowEvent,
    triggerMilestoneCompleted,
    triggerQAPassed,
    triggerVariationApproved,
    triggerTaskCompleted,
    createAutomationRule,
    getAutomationInsights,
    loadAutomationRules
  };
};