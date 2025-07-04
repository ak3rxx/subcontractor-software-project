
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Building2, Users, AlertTriangle, Activity, CreditCard, UserPlus } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
// Permission matrix temporarily removed
import FeatureFlagManager from '@/components/admin/FeatureFlagManager';
import TestUserMode from '@/components/admin/TestUserMode';
import SystemDiagnostics from '@/components/admin/SystemDiagnostics';
import OnboardingEditor from '@/components/admin/OnboardingEditor';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import ClientManagement from '@/components/admin/ClientManagement';
import IssueManagement from '@/components/admin/IssueManagement';
import QADiagnosticTool from '@/components/admin/QADiagnosticTool';
import TopNav from '@/components/TopNav';

const EnhancedDeveloperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent />;
      case 'organizations':
        return <OrganizationManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'subscriptions':
        return <SubscriptionsContent />;
      case 'issues':
        return <IssueManagement />;
      case 'permissions':
        return <div className="text-center p-8"><p className="text-gray-600">Permission management being rebuilt...</p></div>;
      case 'features':
        return <FeatureFlagManager />;
      case 'testing':
        return <TestUserMode />;
      case 'diagnostics':
        return <SystemDiagnostics />;
      case 'qa-diagnostics':
        return <QADiagnosticTool />;
      case 'onboarding':
        return <OnboardingEditor />;
      case 'invite-client':
        return <InviteClientContent />;
      case 'system-status':
        return <SystemStatusContent />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      
      <div className="flex flex-1 bg-gray-50">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-8 w-8 text-purple-600" />
                <h1 className="text-3xl font-bold text-gray-900">Developer Admin</h1>
                <Badge variant="destructive" className="ml-2">Developer Only</Badge>
              </div>
              <p className="text-gray-600">
                Global system administration, client management, and development tools.
              </p>
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const OverviewContent = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Organizations</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex justify-between">
              <span>Active</span>
              <span className="text-green-600 font-semibold">9</span>
            </div>
            <div className="flex justify-between">
              <span>Trial</span>
              <span className="text-blue-600 font-semibold">3</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>All Users</span>
              <span className="font-semibold">147</span>
            </div>
            <div className="flex justify-between">
              <span>Active Sessions</span>
              <span className="text-green-600 font-semibold">23</span>
            </div>
            <div className="flex justify-between">
              <span>New This Month</span>
              <span className="text-blue-600 font-semibold">12</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Open Issues</span>
              <span className="font-semibold">7</span>
            </div>
            <div className="flex justify-between">
              <span>High Priority</span>
              <span className="text-red-600 font-semibold">2</span>
            </div>
            <div className="flex justify-between">
              <span>Resolved Today</span>
              <span className="text-green-600 font-semibold">3</span>
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

    {/* Recent Activity */}
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest system events and user activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { action: "New organization created", detail: "ABC Construction Ltd", time: "2 hours ago" },
            { action: "High priority issue reported", detail: "Document upload failure", time: "4 hours ago" },
            { action: "User invitation sent", detail: "sarah@newcompany.com", time: "6 hours ago" },
            { action: "System diagnostic completed", detail: "All systems healthy", time: "8 hours ago" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-600">{activity.detail}</p>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const SubscriptionsContent = () => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold">Subscription Management</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Revenue Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Monthly Revenue</span>
              <span className="font-semibold">$12,450</span>
            </div>
            <div className="flex justify-between">
              <span>Annual Revenue</span>
              <span className="font-semibold">$149,400</span>
            </div>
            <div className="flex justify-between">
              <span>Growth Rate</span>
              <span className="text-green-600 font-semibold">+15%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Subscription management features coming soon...</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

const InviteClientContent = () => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold">Quick Client Invitation</h3>
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Quick client invitation wizard coming soon...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const SystemStatusContent = () => (
  <div className="space-y-6">
    <h3 className="text-2xl font-bold">System Status</h3>
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-green-600">All Systems Operational</p>
            <p className="text-gray-600">System status dashboard coming soon...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default EnhancedDeveloperAdminDashboard;
