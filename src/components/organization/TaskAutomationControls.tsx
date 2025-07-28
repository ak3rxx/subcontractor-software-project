import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Wrench,
  Calendar,
  Save,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import TaskAutomationStatistics from './TaskAutomationStatistics';

interface TaskAutomationControlsProps {
  organizationId?: string;
}

interface AutoTaskSettings {
  failed_qa_inspections: boolean;
  overdue_rfis: boolean;
  pending_variations: boolean;
  approved_variations: boolean;
  delayed_milestones: boolean;
  construction_milestones: boolean;
  notification_preferences: {
    email_notifications: boolean;
    in_app_notifications: boolean;
    daily_digest: boolean;
  };
}

const defaultSettings: AutoTaskSettings = {
  failed_qa_inspections: true,
  overdue_rfis: true,
  pending_variations: true,
  approved_variations: true,
  delayed_milestones: true,
  construction_milestones: true,
  notification_preferences: {
    email_notifications: true,
    in_app_notifications: true,
    daily_digest: false,
  },
};

const TaskAutomationControls: React.FC<TaskAutomationControlsProps> = ({ 
  organizationId 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutoTaskSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load organization settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!organizationId) return;

      try {
        const { data, error } = await supabase
          .from('organization_settings')
          .select('notification_settings')
          .eq('organization_id', organizationId)
          .single();

        if (error) {
          console.error('Error loading organization settings:', error);
          return;
        }

        if (data?.notification_settings && typeof data.notification_settings === 'object') {
          const notificationSettings = data.notification_settings as any;
          if (notificationSettings.auto_task_settings) {
            setSettings({
              ...defaultSettings,
              ...notificationSettings.auto_task_settings,
            });
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [organizationId]);

  const handleToggle = (key: keyof AutoTaskSettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNotificationToggle = (key: keyof AutoTaskSettings['notification_preferences'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value,
      },
    }));
  };

  const saveSettings = async () => {
    if (!organizationId || !user) return;

    setSaving(true);
    try {
      // Get current settings
      const { data: currentData } = await supabase
        .from('organization_settings')
        .select('notification_settings')
        .eq('organization_id', organizationId)
        .single();

      const currentSettings = currentData?.notification_settings && typeof currentData.notification_settings === 'object' 
        ? currentData.notification_settings as any 
        : {};

      const updatedNotificationSettings = {
        ...currentSettings,
        auto_task_settings: settings,
      };

      const { error } = await supabase
        .from('organization_settings')
        .update({ 
          notification_settings: updatedNotificationSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Task automation preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading task automation settings...</span>
      </div>
    );
  }

  const automationRules = [
    {
      key: 'failed_qa_inspections' as keyof AutoTaskSettings,
      icon: CheckSquare,
      title: 'Failed QA Inspections',
      description: 'Auto-create rectification tasks for failed QA inspections',
      details: 'High priority, 3-day deadline, assigned to inspector',
      color: 'text-red-600',
      enabled: settings.failed_qa_inspections,
    },
    {
      key: 'overdue_rfis' as keyof AutoTaskSettings,
      icon: Clock,
      title: 'Overdue RFIs',
      description: 'Auto-create follow-up tasks for overdue RFI responses',
      details: 'High priority, 2-day deadline, assigned to submitter',
      color: 'text-orange-600',
      enabled: settings.overdue_rfis,
    },
    {
      key: 'pending_variations' as keyof AutoTaskSettings,
      icon: FileText,
      title: 'Pending Variations',
      description: 'Auto-create approval tasks for variations awaiting approval',
      details: 'Medium priority, 5-day deadline, assigned to approver',
      color: 'text-blue-600',
      enabled: settings.pending_variations,
    },
    {
      key: 'approved_variations' as keyof AutoTaskSettings,
      icon: Wrench,
      title: 'Approved Variations',
      description: 'Auto-create site completion tasks for approved variations',
      details: 'Medium priority, 3-day deadline, assigned to site team',
      color: 'text-green-600',
      enabled: settings.approved_variations,
    },
    {
      key: 'delayed_milestones' as keyof AutoTaskSettings,
      icon: AlertTriangle,
      title: 'Delayed Milestones',
      description: 'Auto-create recovery planning tasks for delayed milestones',
      details: 'Priority based on critical path, 1-day deadline',
      color: 'text-yellow-600',
      enabled: settings.delayed_milestones,
    },
    {
      key: 'construction_milestones' as keyof AutoTaskSettings,
      icon: Calendar,
      title: 'Construction Milestones',
      description: 'Auto-create material planning tasks for new construction milestones',
      details: 'High priority, 7-day deadline, assigned to project manager',
      color: 'text-purple-600',
      enabled: settings.construction_milestones,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Task Automation Settings
          </CardTitle>
          <CardDescription>
            Configure automatic task creation rules to reduce manual work and improve project oversight.
            Tasks are created in real-time when conditions are met.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {automationRules.map((rule) => (
              <div key={rule.key} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3 flex-1">
                  <rule.icon className={`h-5 w-5 mt-0.5 ${rule.color}`} />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rule.title}</h4>
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                    <p className="text-xs text-muted-foreground font-mono">{rule.details}</p>
                  </div>
                </div>
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={(checked) => handleToggle(rule.key, checked)}
                />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Notification Preferences</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Email Notifications</span>
                  <span className="text-sm text-muted-foreground">
                    Receive email alerts when auto-tasks are created
                  </span>
                </Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notification_preferences.email_notifications}
                  onCheckedChange={(checked) => handleNotificationToggle('email_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="in-app-notifications" className="flex flex-col space-y-1">
                  <span>In-App Notifications</span>
                  <span className="text-sm text-muted-foreground">
                    Show toast notifications when auto-tasks are created
                  </span>
                </Label>
                <Switch
                  id="in-app-notifications"
                  checked={settings.notification_preferences.in_app_notifications}
                  onCheckedChange={(checked) => handleNotificationToggle('in_app_notifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="daily-digest" className="flex flex-col space-y-1">
                  <span>Daily Digest</span>
                  <span className="text-sm text-muted-foreground">
                    Receive daily summary of auto-created tasks
                  </span>
                </Label>
                <Switch
                  id="daily-digest"
                  checked={settings.notification_preferences.daily_digest}
                  onCheckedChange={(checked) => handleNotificationToggle('daily_digest', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TaskAutomationStatistics organizationId={organizationId} />
    </div>
  );
};

export default TaskAutomationControls;