import React, { createContext, useContext, ReactNode } from 'react';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useWorkflowAutomation } from '@/hooks/useWorkflowAutomation';
import { NotificationTooltip } from './NotificationTooltip';

interface SmartNotificationContextType {
  notifications: ReturnType<typeof useSmartNotifications>['notifications'];
  unreadCount: number;
  addNotification: ReturnType<typeof useSmartNotifications>['addNotification'];
}

const SmartNotificationContext = createContext<SmartNotificationContextType | undefined>(undefined);

export const useSmartNotificationContext = () => {
  const context = useContext(SmartNotificationContext);
  if (!context) {
    throw new Error('useSmartNotificationContext must be used within SmartNotificationProvider');
  }
  return context;
};

interface SmartNotificationProviderProps {
  children: ReactNode;
}

export const SmartNotificationProvider: React.FC<SmartNotificationProviderProps> = ({ children }) => {
  const notificationHook = useSmartNotifications();
  const workflowHook = useWorkflowAutomation();

  const contextValue: SmartNotificationContextType = {
    notifications: notificationHook.notifications,
    unreadCount: notificationHook.unreadCount,
    addNotification: notificationHook.addNotification
  };

  return (
    <SmartNotificationContext.Provider value={contextValue}>
      {children}
      <NotificationTooltip />
    </SmartNotificationContext.Provider>
  );
};