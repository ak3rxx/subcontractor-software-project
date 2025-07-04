
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, Users, Flag, TestTube, Activity, BookOpen, Shield } from 'lucide-react';
// Permission matrix temporarily removed
import FeatureFlagManager from '@/components/admin/FeatureFlagManager';
import TestUserMode from '@/components/admin/TestUserMode';
import SystemDiagnostics from '@/components/admin/SystemDiagnostics';
import OnboardingEditor from '@/components/admin/OnboardingEditor';
import UserActivityLogs from '@/components/admin/UserActivityLogs';

const DeveloperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Developer Admin</h1>
          <Badge variant="destructive" className="ml-2">Developer Only</Badge>
        </div>
        <p className="text-gray-600">
          System administration, permissions management, and development tools.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Diagnostics
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  System Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-semibold">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Developers</span>
                    <span className="font-semibold">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Flags</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enabled</span>
                    <span className="text-green-600 font-semibold">9</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disabled</span>
                    <span className="text-red-600 font-semibold">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Database</span>
                    <span className="text-green-600 font-semibold">Healthy</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Response</span>
                    <span className="text-green-600 font-semibold">142ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className="text-green-600 font-semibold">0.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="text-center p-8">
            <p className="text-gray-600">Permission management being rebuilt...</p>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <FeatureFlagManager />
        </TabsContent>

        <TabsContent value="testing">
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
