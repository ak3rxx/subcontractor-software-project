import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSmartNotifications, SmartNotification } from '@/hooks/useSmartNotifications';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ type }: { type: SmartNotification['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-success" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Info className="w-4 h-4 text-primary" />;
  }
};

export const NotificationTooltip = () => {
  const { notifications, markAsRead, markAsDismissed } = useSmartNotifications();
  const [currentNotification, setCurrentNotification] = useState<SmartNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Show notifications in order of priority
  useEffect(() => {
    const unreadHighPriority = notifications.filter(
      n => !n.read && !n.dismissed && (n.priority === 'high' || n.priority === 'critical')
    );

    if (unreadHighPriority.length > 0 && !currentNotification) {
      const nextNotification = unreadHighPriority[0];
      setCurrentNotification(nextNotification);
      setIsVisible(true);

      // Auto-mark as read after 10 seconds
      const timeout = setTimeout(() => {
        markAsRead(nextNotification.id);
      }, 10000);

      return () => clearTimeout(timeout);
    } else if (unreadHighPriority.length === 0) {
      setCurrentNotification(null);
      setIsVisible(false);
    }
  }, [notifications, currentNotification, markAsRead]);

  const handleDismiss = () => {
    if (currentNotification) {
      markAsDismissed(currentNotification.id);
      setCurrentNotification(null);
      setIsVisible(false);
    }
  };

  const handleAction = (actionFn: () => void) => {
    actionFn();
    if (currentNotification) {
      markAsRead(currentNotification.id);
      setCurrentNotification(null);
      setIsVisible(false);
    }
  };

  if (!currentNotification || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
      <Card className={cn(
        "w-80 shadow-lg border-2 transition-all duration-300",
        currentNotification.priority === 'critical' && "border-destructive shadow-destructive/20",
        currentNotification.priority === 'high' && "border-warning shadow-warning/20",
        currentNotification.type === 'success' && "border-success shadow-success/20"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <NotificationIcon type={currentNotification.type} />
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm text-foreground">
                  {currentNotification.title}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 -mt-1 -mr-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {currentNotification.message}
              </p>

              {currentNotification.actions && currentNotification.actions.length > 0 && (
                <div className="flex gap-2">
                  {currentNotification.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={() => handleAction(action.action)}
                      className="h-7 text-xs"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};