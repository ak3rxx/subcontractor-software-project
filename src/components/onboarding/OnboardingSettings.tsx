import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Play, RotateCcw, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useToast } from '@/hooks/use-toast';

interface OnboardingSettingsProps {
  currentModule?: string;
}

const OnboardingSettings: React.FC<OnboardingSettingsProps> = ({ 
  currentModule = 'dashboard' 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [globalSettings, setGlobalSettings] = useState({
    showOnboardingHelp: true,
    autoStartTours: true,
    showAIAssistant: true,
    enableSmartSuggestions: true
  });

  const {
    progress,
    loading,
    userRole,
    resetOnboarding,
    shouldShowOnboarding,
    shouldShowInteractiveTour
  } = useOnboardingState(currentModule);

  const handleResetModule = async () => {
    try {
      await resetOnboarding();
      toast({
        title: "Module Reset",
        description: `Onboarding for ${currentModule} has been reset. The tour will show again on your next visit.`
      });
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Unable to reset module onboarding. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGlobalSettingChange = (setting: keyof typeof globalSettings, value: boolean) => {
    setGlobalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    toast({
      title: "Settings Updated",
      description: `${setting.replace(/([A-Z])/g, ' $1').toLowerCase()} has been ${value ? 'enabled' : 'disabled'}.`
    });
  };

  const getModuleDisplayName = (module: string) => {
    const names = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      variations: 'Variations',
      qa_itp: 'QA/ITP',
      finance: 'Finance',
      tasks: 'Tasks',
      rfis: 'RFIs',
      documents: 'Documents'
    };
    return names[module as keyof typeof names] || module;
  };

  const getRoleDisplayName = (role: string) => {
    const names = {
      project_manager: 'Project Manager',
      site_supervisor: 'Site Supervisor', 
      estimator: 'Estimator',
      admin: 'Admin',
      org_admin: 'Organization Admin',
      subcontractor: 'Subcontractor',
      client: 'Client'
    };
    return names[role as keyof typeof names] || role;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading onboarding settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Onboarding Settings
          </CardTitle>
          <CardDescription>
            Manage your guided tour and help preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Module</p>
              <p className="text-sm text-muted-foreground">
                {getModuleDisplayName(currentModule)} • Role: {getRoleDisplayName(userRole)}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={progress?.isCompleted ? "default" : "secondary"}>
                {progress?.isCompleted ? "Completed" : "In Progress"}
              </Badge>
              <Badge variant="outline">
                {progress?.completedSteps?.length || 0} steps done
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Global Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Global Preferences</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show Onboarding Helper</p>
                  <p className="text-xs text-muted-foreground">Display the onboarding controls panel</p>
                </div>
                <Switch
                  checked={globalSettings.showOnboardingHelp}
                  onCheckedChange={(checked) => handleGlobalSettingChange('showOnboardingHelp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-start Tours</p>
                  <p className="text-xs text-muted-foreground">Automatically show tours for new modules</p>
                </div>
                <Switch
                  checked={globalSettings.autoStartTours}
                  onCheckedChange={(checked) => handleGlobalSettingChange('autoStartTours', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">AI Assistant</p>
                  <p className="text-xs text-muted-foreground">Enable contextual AI help</p>
                </div>
                <Switch
                  checked={globalSettings.showAIAssistant}
                  onCheckedChange={(checked) => handleGlobalSettingChange('showAIAssistant', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Smart Suggestions</p>
                  <p className="text-xs text-muted-foreground">Get intelligent workflow suggestions</p>
                </div>
                <Switch
                  checked={globalSettings.enableSmartSuggestions}
                  onCheckedChange={(checked) => handleGlobalSettingChange('enableSmartSuggestions', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Module Actions */}
          <div className="space-y-4">
            <h4 className="font-medium">Module Actions</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleResetModule}
                className="justify-start"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Current Module
              </Button>

              <Button 
                variant="outline" 
                disabled
                className="justify-start"
              >
                <Play className="h-4 w-4 mr-2" />
                Restart Tour (Coming Soon)
              </Button>

              <Button 
                variant="outline" 
                disabled
                className="justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View Documentation
              </Button>

              <Button 
                variant="outline" 
                disabled
                className="justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>

          {/* Progress Summary */}
          {progress && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Progress Summary</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Completed Steps:</strong> {progress.completedSteps?.length || 0}
                  </p>
                  <p>
                    <strong>Current Step:</strong> {progress.currentStep || 'None'}
                  </p>
                  <p>
                    <strong>Will Show Tour:</strong> {shouldShowInteractiveTour() ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Last Updated:</strong> Recently
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingSettings;