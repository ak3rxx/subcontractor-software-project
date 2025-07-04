
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Building2, Users, AlertTriangle, Activity, CreditCard, UserPlus, Eye, UserCheck, Shield, Bug } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import FeatureFlagManager from '@/components/admin/FeatureFlagManager';
import TestUserMode from '@/components/admin/TestUserMode';
import SystemDiagnostics from '@/components/admin/SystemDiagnostics';
import OnboardingEditor from '@/components/admin/OnboardingEditor';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import ClientManagement from '@/components/admin/ClientManagement';
import IssueManagement from '@/components/admin/IssueManagement';
import QADiagnosticTool from '@/components/admin/QADiagnosticTool';
import TopNav from '@/components/TopNav';
import { useAuth } from '@/hooks/useAuth';

const EnhancedDeveloperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, isDeveloper, hasRole, isOrgAdmin } = useAuth();

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
        return <PermissionAuditContent />;
      case 'features':
        return <FeatureFlagManager />;
      case 'testing':
        return <RoleTestingContent />;
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
      case 'user-impersonation':
        return <UserImpersonationContent />;
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
                <div className="ml-auto flex gap-2" data-tour="developer-tools">
                  <Badge variant="outline">
                    Current User: {user?.email}
                  </Badge>
                  <Badge variant="secondary">
                    Role: {isDeveloper() ? 'Developer' : 'Admin'}
                  </Badge>
                </div>
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

const PermissionAuditContent = () => {
  const { user, isDeveloper, hasRole, isOrgAdmin } = useAuth();
  
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Permission Audit & Testing</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-tour="permission-matrix">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current User Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Developer Access</span>
                <Badge variant={isDeveloper() ? "default" : "secondary"}>
                  {isDeveloper() ? "✓ Yes" : "✗ No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Organization Admin</span>
                <Badge variant={isOrgAdmin() ? "default" : "secondary"}>
                  {isOrgAdmin() ? "✓ Yes" : "✗ No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Project Manager Role</span>
                <Badge variant={hasRole('project_manager') ? "default" : "secondary"}>
                  {hasRole('project_manager') ? "✓ Yes" : "✗ No"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Can Send Emails</span>
                <Badge variant={isDeveloper() || isOrgAdmin() ? "default" : "secondary"}>
                  {isDeveloper() || isOrgAdmin() ? "✓ Yes" : "✗ No"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>User ID:</strong> {user?.id}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Primary Role:</strong> {user?.primaryRole || 'None'}</div>
              <div><strong>Primary Org:</strong> {user?.primaryOrganization || 'None'}</div>
              <div><strong>Roles Count:</strong> {user?.roles?.length || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RoleTestingContent = () => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Role Testing Tools</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-tour="role-testing">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Quick Role Assignment
            </CardTitle>
            <CardDescription>
              Test different role combinations for development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Role</label>
              <select 
                className="w-full mt-1 p-2 border rounded-md"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Select a role</option>
                <option value="developer">Developer</option>
                <option value="org_admin">Organization Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="estimator">Estimator</option>
                <option value="site_supervisor">Site Supervisor</option>
                <option value="subcontractor">Subcontractor</option>
                <option value="client">Client</option>
              </select>
            </div>
            <Button className="w-full" disabled>
              Apply Test Role (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Access Control Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Shield className="h-4 w-4 mr-2" />
                Test Module Access
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <Eye className="h-4 w-4 mr-2" />
                Test Data Visibility
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                <UserCheck className="h-4 w-4 mr-2" />
                Test Action Permissions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UserImpersonationContent = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">User Impersonation</h3>
      <Card data-tour="user-impersonation">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            View as User
          </CardTitle>
          <CardDescription>
            Test the application from another user's perspective
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select User to Impersonate</label>
              <select className="w-full mt-1 p-2 border rounded-md">
                <option value="">Select a user</option>
                <option value="user1">john@example.com (Project Manager)</option>
                <option value="user2">sarah@example.com (Site Supervisor)</option>
                <option value="user3">mike@example.com (Subcontractor)</option>
              </select>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Safety Notice:</strong> User impersonation will be logged for security audit.
              </p>
            </div>
            <Button className="w-full" disabled>
              Start Impersonation Session (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDeveloperAdminDashboard;
