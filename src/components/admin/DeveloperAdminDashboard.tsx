
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Users, Flag, Activity, Wrench, Eye, ShieldCheck } from 'lucide-react';
import PermissionMatrix from './PermissionMatrix';
import FeatureFlagManager from './FeatureFlagManager';
import TestUserMode from './TestUserMode';
import SystemDiagnostics from './SystemDiagnostics';
import OnboardingEditor from './OnboardingEditor';
import UserActivityLogs from './UserActivityLogs';

const DeveloperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Developer Admin Panel</h1>
        </div>
        <p className="text-gray-600">
          System-wide controls and diagnostics. Developer access only.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="test-mode" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Test Mode
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Role System</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Permissions</span>
                    <Badge variant="default">Enforced</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Feature Flags</span>
                    <Badge variant="default">Running</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Badge variant="outline">Developer</Badge>
                  <Badge variant="outline">Org Admin</Badge>
                  <Badge variant="outline">Project Manager</Badge>
                  <Badge variant="outline">Estimator</Badge>
                  <Badge variant="outline">Admin</Badge>
                  <Badge variant="outline">Site Supervisor</Badge>
                  <Badge variant="outline">Subcontractor</Badge>
                  <Badge variant="outline">Client</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full">
                  Run Health Check
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Clear Cache
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  Export Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionMatrix />
        </TabsContent>

        <TabsContent value="features">
          <FeatureFlagManager />
        </TabsContent>

        <TabsContent value="test-mode">
          <TestUserMode />
        </TabsContent>

        <TabsContent value="diagnostics">
          <SystemDiagnostics />
        </TabsContent>

        <TabsContent value="onboarding">
          <OnboardingEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperAdminDashboard;
