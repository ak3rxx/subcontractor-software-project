import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'progress';
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
  progress?: number;
  progressText?: string;
  category?: string;
  metadata?: any;
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
  const [systemHealth, setSystemHealth] = useState({ 
    isHealthy: true, 
    lastError: null as string | null,
    channelStatus: 'connected' as 'connected' | 'disconnected' | 'error'
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

  // Enhanced notification creation with deduplication - FIXED: Stable memoization
  const createNotification = useCallback((notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => {
    try {
      // Use ref to avoid dependency on notifications state
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      setNotifications(prev => {
        // Check for duplicates within the setter to avoid state dependency
        const isDuplicate = prev.some(n => 
          n.title === notification.title && 
          n.moduleSource === notification.moduleSource &&
          n.timestamp > fiveMinutesAgo &&
          !n.dismissed
        );

        if (!isDuplicate) {
          const newNotification: SmartNotification = {
            ...notification,
            id: crypto.randomUUID(),
            timestamp: new Date(),
            read: false,
            dismissed: false
          };

          // Show toast for high/critical priority
          if (notification.priority === 'high' || notification.priority === 'critical') {
            toast({
              title: notification.title,
              description: notification.message,
              variant: notification.type === 'error' ? 'destructive' : 'default'
            });
          }

          return [newNotification, ...prev.slice(0, 49)];
        }
        
        return prev;
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      setSystemHealth(prev => ({ ...prev, lastError: `Notification creation failed: ${error}` }));
    }
  }, [toast]); // Only depend on toast, not notifications

  // Analytics-driven notification monitoring with enhanced error handling
  useEffect(() => {
    const checkAnalyticsAlerts = async () => {
      try {
        setSystemHealth(prev => ({ ...prev, isHealthy: true, lastError: null }));
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
              createNotification({
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
            createNotification({
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
            createNotification({
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
        setSystemHealth(prev => ({ 
          ...prev, 
          isHealthy: false, 
          lastError: `Analytics check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }));
      }
    };

    // Check alerts every 15 minutes (reduced frequency)
    const interval = setInterval(checkAnalyticsAlerts, 15 * 60 * 1000);
    checkAnalyticsAlerts(); // Initial check

    return () => clearInterval(interval);
  }, [rules, createNotification]);

  // Enhanced real-time monitoring with error handling and single channel
  useEffect(() => {
    let isSubscribed = true;
    
    const handleVariationUpdate = (payload: any) => {
      try {
        if (!isSubscribed) return;
        const { old: old_record, new: new_record } = payload;
        
        if (old_record?.status !== new_record?.status) {
          if (new_record.status === 'approved') {
            createNotification({
              type: 'success',
              priority: 'medium',
              title: 'Variation Approved',
              message: `Variation "${new_record.title}" has been approved`,
              moduleSource: 'variations',
              relatedId: new_record.id,
              actionable: false
            });
          } else if (new_record.status === 'rejected') {
            createNotification({
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
              }]
            });
          }
        }
      } catch (error) {
        console.error('Error handling variation update:', error);
        setSystemHealth(prev => ({ ...prev, lastError: `Variation update failed: ${error}` }));
      }
    };

    const handleQAInsert = (payload: any) => {
      try {
        if (!isSubscribed) return;
        const record = payload.new;
        
        if (record?.overall_status === 'failed') {
          createNotification({
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
            }]
          });
        }
      } catch (error) {
        console.error('Error handling QA insert:', error);
        setSystemHealth(prev => ({ ...prev, lastError: `QA insert failed: ${error}` }));
      }
    };

    const handleTaskUpdate = (payload: any) => {
      try {
        if (!isSubscribed) return;
        const record = payload.new || payload.old;
        
        if (record && typeof record === 'object' && 'due_date' in record && record.due_date) {
          const taskRecord = record as any;
          const dueDate = new Date(taskRecord.due_date);
          const today = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 1 && taskRecord.status !== 'completed') {
            createNotification({
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
              }]
            });
          }
        }
      } catch (error) {
        console.error('Error handling task update:', error);
        setSystemHealth(prev => ({ ...prev, lastError: `Task update failed: ${error}` }));
      }
    };

    try {
      // Use single channel with multiple listeners
      const channel = supabase
        .channel('smart-notifications-main')
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'variations' 
        }, handleVariationUpdate)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'qa_inspections' 
        }, handleQAInsert)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, handleTaskUpdate)
        .subscribe((status) => {
          setSystemHealth(prev => ({ 
            ...prev, 
            channelStatus: status === 'SUBSCRIBED' ? 'connected' : 
                          status === 'CHANNEL_ERROR' ? 'error' : 'disconnected'
          }));
        });

      return () => {
        isSubscribed = false;
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setSystemHealth(prev => ({ 
        ...prev, 
        channelStatus: 'error',
        lastError: `Subscription setup failed: ${error}` 
      }));
    }
  }, [createNotification]);

  const activeNotifications = notifications.filter(n => !n.dismissed);
  const unreadCount = activeNotifications.filter(n => !n.read).length;

  // Health check function for diagnostics
  const getSystemHealth = useCallback(() => {
    return {
      ...systemHealth,
      notificationCount: notifications.length,
      unreadCount,
      activeChannels: systemHealth.channelStatus === 'connected' ? 1 : 0,
      rulesEnabled: Object.values(rules).filter(rule => rule.enabled).length
    };
  }, [systemHealth, notifications.length, unreadCount, rules]);

  // QA-specific notification helpers
  const createQAUploadProgress = useCallback((fileName: string, progress: number, total: number) => {
    return addNotification({
      type: 'progress',
      priority: 'medium',
      title: 'File Upload in Progress',
      message: `Uploading ${fileName}...`,
      moduleSource: 'qa-upload',
      actionable: false,
      progress,
      progressText: `${progress}/${total} files`,
      category: 'file-upload'
    });
  }, [addNotification]);

  const createQAUploadSuccess = useCallback((fileName: string, fileUrl?: string) => {
    return addNotification({
      type: 'success',
      priority: 'low',
      title: 'File Upload Complete',
      message: `${fileName} uploaded successfully`,
      moduleSource: 'qa-upload',
      actionable: fileUrl ? true : false,
      actions: fileUrl ? [{
        label: 'View File',
        action: () => window.open(fileUrl, '_blank')
      }] : undefined,
      category: 'file-upload'
    });
  }, [addNotification]);

  const createQAUploadError = useCallback((fileName: string, error: string) => {
    return addNotification({
      type: 'error',
      priority: 'high',
      title: 'File Upload Failed',
      message: `Failed to upload ${fileName}: ${error}`,
      moduleSource: 'qa-upload',
      actionable: true,
      actions: [{
        label: 'Retry Upload',
        action: () => {
          // This will be handled by the component
          console.log('Retry upload action triggered');
        }
      }],
      category: 'file-upload'
    });
  }, [addNotification]);

  const createQAValidationWarning = useCallback((fieldName: string, message: string, relatedId?: string) => {
    return addNotification({
      type: 'warning',
      priority: 'medium',
      title: 'Form Validation',
      message: `${fieldName}: ${message}`,
      moduleSource: 'qa-validation',
      relatedId,
      actionable: true,
      category: 'form-validation'
    });
  }, [addNotification]);

  const createQAFormMilestone = useCallback((milestone: string, message: string, relatedId?: string) => {
    return addNotification({
      type: 'success',
      priority: 'low',
      title: `${milestone} Complete ✓`,
      message,
      moduleSource: 'qa-progress',
      relatedId,
      actionable: false,
      category: 'form-milestone'
    });
  }, [addNotification]);

  const createQAContextualHelp = useCallback((helpTitle: string, helpMessage: string, helpActions?: NotificationAction[]) => {
    return addNotification({
      type: 'info',
      priority: 'low',
      title: helpTitle,
      message: helpMessage,
      moduleSource: 'qa-help',
      actionable: helpActions ? true : false,
      actions: helpActions,
      category: 'contextual-help'
    });
  }, [addNotification]);

  const createQAProcessGuide = useCallback((stage: string, nextSteps: string, relatedId?: string) => {
    return addNotification({
      type: 'info',
      priority: 'medium',
      title: `Process Guide: ${stage}`,
      message: nextSteps,
      moduleSource: 'qa-guide',
      relatedId,
      actionable: true,
      category: 'process-guide'
    });
  }, [addNotification]);

  return {
    notifications: activeNotifications,
    unreadCount,
    rules,
    setRules,
    addNotification,
    markAsRead,
    markAsDismissed,
    clearAll,
    getSystemHealth,
    systemHealth,
    // QA-specific notification helpers
    createQAUploadProgress,
    createQAUploadSuccess,
    createQAUploadError,
    createQAValidationWarning,
    createQAFormMilestone,
    createQAContextualHelp,
    createQAProcessGuide
  };
};