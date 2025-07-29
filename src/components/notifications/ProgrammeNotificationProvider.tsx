import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProgrammeMilestone } from '@/hooks/useProgrammeMilestones';

interface ProgrammeNotification {
  id: string;
  type: 'critical-path' | 'milestone-due' | 'risk-alert' | 'performance' | 'conflict';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  projectId: string;
  milestoneId?: string;
  actions?: Array<{
    label: string;
    action: string;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  dismissed: boolean;
  autoShowToast: boolean;
}

interface ProgrammeNotificationContextType {
  notifications: ProgrammeNotification[];
  addNotification: (notification: Omit<ProgrammeNotification, 'id' | 'timestamp' | 'dismissed'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: (projectId?: string) => void;
  getUnreadCount: (projectId?: string) => number;
  markAsRead: (id: string) => void;
}

const ProgrammeNotificationContext = createContext<ProgrammeNotificationContextType | undefined>(undefined);

export const useProgrammeNotifications = () => {
  const context = useContext(ProgrammeNotificationContext);
  if (!context) {
    throw new Error('useProgrammeNotifications must be used within a ProgrammeNotificationProvider');
  }
  return context;
};

interface ProgrammeNotificationProviderProps {
  children: React.ReactNode;
  milestones: ProgrammeMilestone[];
  projectId: string;
}

export const ProgrammeNotificationProvider: React.FC<ProgrammeNotificationProviderProps> = ({
  children,
  milestones,
  projectId
}) => {
  const [notifications, setNotifications] = useState<ProgrammeNotification[]>([]);
  const { toast } = useToast();

  // Generate smart notifications based on milestone changes
  useEffect(() => {
    if (!projectId || milestones.length === 0) return;

    const now = new Date();
    const upcomingDays = 7;

    // Check for milestones due within 7 days
    const upcomingMilestones = milestones.filter(milestone => {
      if (!milestone.planned_date || milestone.status === 'complete') return false;
      
      const plannedDate = new Date(milestone.planned_date);
      const daysUntilDue = Math.ceil((plannedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilDue >= 0 && daysUntilDue <= upcomingDays;
    });

    // Check for overdue milestones
    const overdueMilestones = milestones.filter(milestone => {
      if (!milestone.planned_date || milestone.status === 'complete') return false;
      
      const plannedDate = new Date(milestone.planned_date);
      return plannedDate < now;
    });

    // Check for critical path milestones at risk
    const criticalMilestones = milestones.filter(milestone => 
      milestone.critical_path && 
      milestone.status !== 'complete' &&
      (milestone.status === 'delayed' || milestone.priority === 'high')
    );

    // Generate notifications
    const newNotifications: Omit<ProgrammeNotification, 'id' | 'timestamp' | 'dismissed'>[] = [];

    // Upcoming milestone notifications
    upcomingMilestones.forEach(milestone => {
      const daysUntilDue = Math.ceil((new Date(milestone.planned_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        type: 'milestone-due',
        priority: daysUntilDue <= 2 ? 'high' : 'medium',
        title: `Milestone Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
        message: `${milestone.milestone_name} (${milestone.trade || 'General'})`,
        projectId,
        milestoneId: milestone.id,
        autoShowToast: daysUntilDue <= 1,
        actions: [
          { label: 'View Details', action: 'view-milestone' },
          { label: 'Update Status', action: 'update-milestone' }
        ]
      });
    });

    // Overdue milestone notifications
    overdueMilestones.forEach(milestone => {
      const daysOverdue = Math.ceil((now.getTime() - new Date(milestone.planned_date!).getTime()) / (1000 * 60 * 60 * 24));
      
      newNotifications.push({
        type: 'milestone-due',
        priority: 'critical',
        title: `Milestone Overdue`,
        message: `${milestone.milestone_name} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
        projectId,
        milestoneId: milestone.id,
        autoShowToast: true,
        actions: [
          { label: 'Reschedule', action: 'reschedule-milestone', variant: 'destructive' },
          { label: 'Mark Complete', action: 'complete-milestone' }
        ]
      });
    });

    // Critical path notifications
    if (criticalMilestones.length > 0) {
      newNotifications.push({
        type: 'critical-path',
        priority: 'high',
        title: 'Critical Path Alert',
        message: `${criticalMilestones.length} critical milestone${criticalMilestones.length > 1 ? 's' : ''} require attention`,
        projectId,
        autoShowToast: true,
        actions: [
          { label: 'View Critical Path', action: 'view-critical-path' },
          { label: 'Adjust Schedule', action: 'adjust-schedule' }
        ]
      });
    }

    // Add new notifications (avoid duplicates)
    newNotifications.forEach(notification => {
      addNotification(notification);
    });

  }, [milestones, projectId]);

  const addNotification = (notification: Omit<ProgrammeNotification, 'id' | 'timestamp' | 'dismissed'>) => {
    const id = `${notification.type}-${notification.projectId}-${Date.now()}-${Math.random()}`;
    const newNotification: ProgrammeNotification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      dismissed: false
    };

    // Check for duplicates
    const isDuplicate = notifications.some(existing => 
      existing.type === notification.type &&
      existing.title === notification.title &&
      existing.milestoneId === notification.milestoneId &&
      !existing.dismissed
    );

    if (isDuplicate) return;

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for high priority notifications
    if (notification.autoShowToast && (notification.priority === 'high' || notification.priority === 'critical')) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'critical' ? 'destructive' : 'default'
      });
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, dismissed: true }
          : notification
      )
    );
  };

  const clearAllNotifications = (projectId?: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        (!projectId || notification.projectId === projectId)
          ? { ...notification, dismissed: true }
          : notification
      )
    );
  };

  const getUnreadCount = (projectId?: string) => {
    return notifications.filter(notification => 
      !notification.dismissed &&
      (!projectId || notification.projectId === projectId)
    ).length;
  };

  const markAsRead = (id: string) => {
    // For now, same as dismiss - could be expanded for read vs dismissed states
    dismissNotification(id);
  };

  const value: ProgrammeNotificationContextType = {
    notifications: notifications.filter(n => !n.dismissed),
    addNotification,
    dismissNotification,
    clearAllNotifications,
    getUnreadCount,
    markAsRead
  };

  return (
    <ProgrammeNotificationContext.Provider value={value}>
      {children}
    </ProgrammeNotificationContext.Provider>
  );
};