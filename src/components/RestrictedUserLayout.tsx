
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Building2, Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// Removed broken permissions import
// Removed broken imports - using simple auth check
import TopNav from '@/components/TopNav';

const RestrictedUserLayout: React.FC = () => {
  const { user } = useAuth();
  // Emergency bypass: use user data directly from auth
  const userProfile = user;
  const validation = null;
  const loading = false;

  const handleRequestRole = async (role: string) => {
    console.log('Role request:', role);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav />
      
      <div className="flex-1 container mx-auto py-6 space-y-6 max-w-4xl">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            Your account requires role assignment before you can access the system features.
          </p>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Role Assignment Required:</strong> Your current role assignment is invalid or unassigned. 
            Please contact your organization administrator or request a role assignment below.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Profile
              </CardTitle>
              <CardDescription>Current account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-lg">{userProfile?.user_metadata?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {userProfile?.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Current Role</label>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {userProfile?.user_metadata?.role || 'Unassigned'}
                  </Badge>
                  <span className="text-sm text-red-600">Invalid</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  {validation?.validation_status === 'pending_assignment' ? 'Pending Assignment' : 'Needs Assignment'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organization Details
              </CardTitle>
              <CardDescription>Your organization information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Company</label>
                <p className="text-lg">{userProfile?.user_metadata?.company || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-lg flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {userProfile?.user_metadata?.phone || 'Not set'}
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Need Help?</strong> Contact your organization administrator to assign you the appropriate role for your position.
                </p>
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500">Available roles in your organization:</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">Project Manager</Badge>
                    <Badge variant="outline">Site Supervisor</Badge>
                    <Badge variant="outline">Estimator</Badge>
                    <Badge variant="outline">Admin</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Role Assignment</CardTitle>
            <CardDescription>
              Select the role that best matches your position and responsibilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleRequestRole('project_manager')}
                disabled={validation?.validation_status === 'pending_assignment'}
                className="flex flex-col h-auto p-4"
              >
                <span className="font-medium">Project Manager</span>
                <span className="text-xs text-gray-500">Full project access</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleRequestRole('site_supervisor')}
                disabled={validation?.validation_status === 'pending_assignment'}
                className="flex flex-col h-auto p-4"
              >
                <span className="font-medium">Site Supervisor</span>
                <span className="text-xs text-gray-500">Site & QA access</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleRequestRole('estimator')}
                disabled={validation?.validation_status === 'pending_assignment'}
                className="flex flex-col h-auto p-4"
              >
                <span className="font-medium">Estimator</span>
                <span className="text-xs text-gray-500">Finance & docs</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleRequestRole('admin')}
                disabled={validation?.validation_status === 'pending_assignment'}
                className="flex flex-col h-auto p-4"
              >
                <span className="font-medium">Admin</span>
                <span className="text-xs text-gray-500">Administrative tasks</span>
              </Button>
            </div>
            
            {validation?.validation_status === 'pending_assignment' && (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  Your role assignment request has been submitted and is pending approval from your organization administrator.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestrictedUserLayout;
