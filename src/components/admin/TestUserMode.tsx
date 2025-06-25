
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, RotateCcw } from 'lucide-react';
import { UserRole } from '@/hooks/usePermissions';

const TestUserMode: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('project_manager');
  const [isTestMode, setIsTestMode] = useState(false);

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'developer', label: 'Developer', description: 'Full system access + admin panels' },
    { value: 'org_admin', label: 'Organization Admin', description: 'Org panel + user management' },
    { value: 'project_manager', label: 'Project Manager', description: 'Full project module access' },
    { value: 'estimator', label: 'Estimator', description: 'Finance, docs, RFIs, tasks, variations' },
    { value: 'admin', label: 'Admin/Project Engineer', description: 'QA/ITPs, docs, tasks, RFIs' },
    { value: 'site_supervisor', label: 'Site Supervisor', description: 'Tasks, ITPs, handovers, deliveries' },
    { value: 'subcontractor', label: 'Subcontractor', description: 'Limited to assigned tasks only' },
    { value: 'client', label: 'Client/Builder', description: 'Read-only filtered reports' },
  ];

  const startTestMode = () => {
    setIsTestMode(true);
    // In a real implementation, this would temporarily override the user's role
    // For now, this is a UI demonstration
  };

  const exitTestMode = () => {
    setIsTestMode(false);
    // Reset to original developer role
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Test User Mode
          </CardTitle>
          <CardDescription>
            Simulate different user roles to test permissions and UI behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTestMode && (
            <Alert>
              <AlertDescription>
                You are currently testing as: <Badge variant="outline">{selectedRole}</Badge>
                This affects your navigation and module access.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Role to Test</label>
            <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-gray-500">{role.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {!isTestMode ? (
              <Button onClick={startTestMode} className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Start Test Mode
              </Button>
            ) : (
              <Button onClick={exitTestMode} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Exit Test Mode
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <strong>{roles.find(r => r.value === selectedRole)?.label}</strong> has access to:
          </div>
          {/* This would show a preview of what modules this role can access */}
          <div className="mt-2 text-xs text-gray-500">
            Permission preview will be implemented based on the selected role's access matrix.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestUserMode;
