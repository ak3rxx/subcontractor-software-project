import React, { createContext, useContext, ReactNode } from 'react';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import { useWorkflowAutomation } from '@/hooks/useWorkflowAutomation';
import { NotificationTooltip } from './NotificationTooltip';
import { ErrorBoundaryNotifications } from './ErrorBoundaryNotifications';

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

  const handleNotificationError = (error: Error) => {
    console.error('Notification provider error:', error);
    // Log to system health if available
    if ('systemHealth' in notificationHook) {
      // Additional error reporting could go here
    }
  };

  return (
    <ErrorBoundaryNotifications onError={handleNotificationError}>
      <SmartNotificationContext.Provider value={contextValue}>
        {children}
        <ErrorBoundaryNotifications>
          <NotificationTooltip />
        </ErrorBoundaryNotifications>
      </SmartNotificationContext.Provider>
    </ErrorBoundaryNotifications>
  );
};