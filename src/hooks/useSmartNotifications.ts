import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  moduleSource: string;
  relatedId?: string;
  actionable: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  autoAction?: () => void;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

interface NotificationRules {
  budgetOverrun: { threshold: number; enabled: boolean };
  timelineDelay: { threshold: number; enabled: boolean };
  qaFailures: { threshold: number; enabled: boolean };
  approvalBacklog: { threshold: number; enabled: boolean };
}

export const useSmartNotifications = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [rules, setRules] = useState<NotificationRules>({
    budgetOverrun: { threshold: 10, enabled: true },
    timelineDelay: { threshold: 3, enabled: true },
    qaFailures: { threshold: 2, enabled: true },
    approvalBacklog: { threshold: 5, enabled: true }
  });
  const { toast } = useToast();

  const addNotification = useCallback((notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    const newNotification: SmartNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      dismissed: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications

    // Show toast for high/critical priority
    if (notification.priority === 'high' || notification.priority === 'critical') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      });
    }

    return newNotification.id;
  }, [toast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAsDismissed = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Analytics-driven notification monitoring
  useEffect(() => {
    const checkAnalyticsAlerts = async () => {
      try {
        // Check budget overruns
        if (rules.budgetOverrun.enabled) {
          const { data: projects } = await supabase
            .from('projects')
            .select(`
              id, name, total_budget,
              variations(cost_impact)
            `);

          projects?.forEach(project => {
            const totalVariationCost = project.variations?.reduce((sum: number, v: any) => sum + (v.cost_impact || 0), 0) || 0;
            const overrunPercentage = project.total_budget > 0 ? (totalVariationCost / project.total_budget) * 100 : 0;

            if (overrunPercentage > rules.budgetOverrun.threshold) {
              addNotification({
                type: 'warning',
                priority: overrunPercentage > 20 ? 'critical' : 'high',
                title: 'Budget Overrun Alert',
                message: `Project "${project.name}" is ${overrunPercentage.toFixed(1)}% over budget`,
                moduleSource: 'finance',
                relatedId: project.id,
                actionable: true,
                actions: [{
                  label: 'Review Budget',
                  action: () => window.location.href = `/projects?tab=finance&project=${project.id}`
                }]
              });
            }
          });
        }

        // Check pending approvals backlog
        if (rules.approvalBacklog.enabled) {
          const { data: pendingVariations } = await supabase
            .from('variations')
            .select('*')
            .eq('status', 'pending_approval');

          if (pendingVariations && pendingVariations.length > rules.approvalBacklog.threshold) {
            addNotification({
              type: 'warning',
              priority: 'medium',
              title: 'Approval Backlog',
              message: `${pendingVariations.length} variations awaiting approval`,
              moduleSource: 'variations',
              actionable: true,
              actions: [{
                label: 'Review Pending',
                action: () => window.location.href = '/projects?tab=variations&filter=pending'
              }]
            });
          }
        }

        // Check QA failure patterns
        if (rules.qaFailures.enabled) {
          const { data: recentFailures } = await supabase
            .from('qa_inspections')
            .select('*')
            .eq('overall_status', 'failed')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (recentFailures && recentFailures.length >= rules.qaFailures.threshold) {
            addNotification({
              type: 'error',
              priority: 'high',
              title: 'Quality Issues Detected',
              message: `${recentFailures.length} QA inspections failed in the last 7 days`,
              moduleSource: 'qa',
              actionable: true,
              actions: [{
                label: 'Review QA Issues',
                action: () => window.location.href = '/projects?tab=qa&filter=failed'
              }]
            });
          }
        }

      } catch (error) {
        console.error('Error checking analytics alerts:', error);
      }
    };

    // Check alerts every 5 minutes
    const interval = setInterval(checkAnalyticsAlerts, 5 * 60 * 1000);
    checkAnalyticsAlerts(); // Initial check

    return () => clearInterval(interval);
  }, [rules, addNotification]);

  // Real-time monitoring for immediate alerts
  useEffect(() => {
    const handleVariationUpdate = (payload: any) => {
      const { old: old_record, new: new_record } = payload;
      
      if (old_record.status !== new_record.status) {
        if (new_record.status === 'approved') {
          setNotifications(prev => [{
            id: crypto.randomUUID(),
            type: 'success',
            priority: 'medium',
            title: 'Variation Approved',
            message: `Variation "${new_record.title}" has been approved`,
            moduleSource: 'variations',
            relatedId: new_record.id,
            actionable: false,
            timestamp: new Date(),
            read: false,
            dismissed: false
          }, ...prev.slice(0, 49)]);
        } else if (new_record.status === 'rejected') {
          setNotifications(prev => [{
            id: crypto.randomUUID(),
            type: 'warning',
            priority: 'medium',
            title: 'Variation Rejected',
            message: `Variation "${new_record.title}" has been rejected`,
            moduleSource: 'variations',
            relatedId: new_record.id,
            actionable: true,
            actions: [{
              label: 'Review Feedback',
              action: () => window.location.href = `/projects?tab=variations&id=${new_record.id}`
            }],
            timestamp: new Date(),
            read: false,
            dismissed: false
          }, ...prev.slice(0, 49)]);
        }
      }
    };

    const handleQAInsert = (payload: any) => {
      const record = payload.new;
      
      if (record.overall_status === 'failed') {
        setNotifications(prev => [{
          id: crypto.randomUUID(),
          type: 'error',
          priority: 'high',
          title: 'QA Inspection Failed',
          message: `Inspection ${record.inspection_number} failed for ${record.task_area}`,
          moduleSource: 'qa',
          relatedId: record.id,
          actionable: true,
          actions: [{
            label: 'Review Details',
            action: () => window.location.href = `/projects?tab=qa&inspection=${record.id}`
          }],
          timestamp: new Date(),
          read: false,
          dismissed: false
        }, ...prev.slice(0, 49)]);
      }
    };

    const handleTaskUpdate = (payload: any) => {
      const record = payload.new || payload.old;
      
      if (record && typeof record === 'object' && 'due_date' in record && record.due_date) {
        const taskRecord = record as any;
        const dueDate = new Date(taskRecord.due_date);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 1 && taskRecord.status !== 'completed') {
          setNotifications(prev => [{
            id: crypto.randomUUID(),
            type: 'warning',
            priority: daysUntilDue < 0 ? 'critical' : 'high',
            title: daysUntilDue < 0 ? 'Task Overdue' : 'Task Due Soon',
            message: `Task "${taskRecord.title || 'Untitled'}" is ${daysUntilDue < 0 ? 'overdue' : 'due today'}`,
            moduleSource: 'tasks',
            relatedId: taskRecord.id || '',
            actionable: true,
            actions: [{
              label: 'Complete Task',
              action: () => window.location.href = `/projects?tab=tasks&task=${taskRecord.id || ''}`
            }],
            timestamp: new Date(),
            read: false,
            dismissed: false
          }, ...prev.slice(0, 49)]);
        }
      }
    };

    const channels = [
      supabase
        .channel('notifications-variations')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'variations' 
        }, handleVariationUpdate)
        .subscribe(),

      supabase
        .channel('notifications-qa')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'qa_inspections' 
        }, handleQAInsert)
        .subscribe(),

      supabase
        .channel('notifications-tasks')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, handleTaskUpdate)
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []); // Removed addNotification dependency

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const unreadCount = activeNotifications.filter(n => !n.read).length;

  return {
    notifications: activeNotifications,
    unreadCount,
    rules,
    setRules,
    addNotification,
    markAsRead,
    markAsDismissed,
    clearAll
  };
};