import React, { useState } from 'react';
import { Bell, Settings, X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useSmartNotifications, SmartNotification } from '@/hooks/useSmartNotifications';
import { formatDistanceToNow } from 'date-fns';

const NotificationIcon = ({ type }: { type: SmartNotification['type'] }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-success" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const PriorityBadge = ({ priority }: { priority: SmartNotification['priority'] }) => {
  const variants = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
    critical: 'destructive'
  } as const;

  return (
    <Badge variant={variants[priority]} className="text-xs">
      {priority}
    </Badge>
  );
};

const NotificationItem = ({ notification }: { notification: SmartNotification }) => {
  const { markAsRead, markAsDismissed } = useSmartNotifications();

  const handleRead = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleDismiss = () => {
    markAsDismissed(notification.id);
  };

  return (
    <Card className={`mb-3 transition-all duration-200 ${notification.read ? 'opacity-75' : 'border-primary/20'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <NotificationIcon type={notification.type} />
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <PriorityBadge priority={notification.priority} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })} • {notification.moduleSource}
          </span>
          <div className="flex gap-2">
            {!notification.read && (
              <Button variant="ghost" size="sm" onClick={handleRead} className="h-6 text-xs">
                Mark Read
              </Button>
            )}
            {notification.actions?.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => {
                  action.action();
                  handleRead();
                }}
                className="h-6 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationSettings = () => {
  const { rules, setRules } = useSmartNotifications();

  const updateRule = (key: keyof typeof rules, field: 'threshold' | 'enabled', value: number | boolean) => {
    setRules(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Budget Overrun Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when project exceeds budget threshold</p>
            </div>
            <Switch
              checked={rules.budgetOverrun.enabled}
              onCheckedChange={(checked) => updateRule('budgetOverrun', 'enabled', checked)}
            />
          </div>
          {rules.budgetOverrun.enabled && (
            <div className="ml-4">
              <Label htmlFor="budget-threshold">Threshold (%)</Label>
              <Input
                id="budget-threshold"
                type="number"
                value={rules.budgetOverrun.threshold}
                onChange={(e) => updateRule('budgetOverrun', 'threshold', parseInt(e.target.value) || 0)}
                className="w-20"
              />
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Timeline Delay Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when tasks are overdue by threshold days</p>
            </div>
            <Switch
              checked={rules.timelineDelay.enabled}
              onCheckedChange={(checked) => updateRule('timelineDelay', 'enabled', checked)}
            />
          </div>
          {rules.timelineDelay.enabled && (
            <div className="ml-4">
              <Label htmlFor="timeline-threshold">Days overdue</Label>
              <Input
                id="timeline-threshold"
                type="number"
                value={rules.timelineDelay.threshold}
                onChange={(e) => updateRule('timelineDelay', 'threshold', parseInt(e.target.value) || 0)}
                className="w-20"
              />
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>QA Failure Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when QA failures exceed threshold</p>
            </div>
            <Switch
              checked={rules.qaFailures.enabled}
              onCheckedChange={(checked) => updateRule('qaFailures', 'enabled', checked)}
            />
          </div>
          {rules.qaFailures.enabled && (
            <div className="ml-4">
              <Label htmlFor="qa-threshold">Failure count</Label>
              <Input
                id="qa-threshold"
                type="number"
                value={rules.qaFailures.threshold}
                onChange={(e) => updateRule('qaFailures', 'threshold', parseInt(e.target.value) || 0)}
                className="w-20"
              />
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Approval Backlog Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when pending approvals exceed threshold</p>
            </div>
            <Switch
              checked={rules.approvalBacklog.enabled}
              onCheckedChange={(checked) => updateRule('approvalBacklog', 'enabled', checked)}
            />
          </div>
          {rules.approvalBacklog.enabled && (
            <div className="ml-4">
              <Label htmlFor="approval-threshold">Pending count</Label>
              <Input
                id="approval-threshold"
                type="number"
                value={rules.approvalBacklog.threshold}
                onChange={(e) => updateRule('approvalBacklog', 'threshold', parseInt(e.target.value) || 0)}
                className="w-20"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const { notifications, unreadCount, clearAll } = useSmartNotifications();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6 h-full overflow-y-auto">
          {showSettings ? (
            <NotificationSettings />
          ) : (
            <div>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {notifications.map(notification => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};