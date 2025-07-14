import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';
import { Loader2, Building2 } from 'lucide-react';

const OrganizationPanel: React.FC = () => {
  const { user, loading, rolesLoading, isOrgAdmin, isDeveloper, primaryOrganization } = useAuth();
  
  // Debug logging
  console.log('=== OrganizationPanel Debug ===');
  console.log('user:', user);
  console.log('user.roles:', user?.roles);
  console.log('loading:', loading);
  console.log('rolesLoading:', rolesLoading);
  console.log('isDeveloper():', isDeveloper());
  console.log('isOrgAdmin():', isOrgAdmin());
  console.log('primaryOrganization:', primaryOrganization);
  
  // Show loading while authentication and roles are being loaded
  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Building2 className="h-12 w-12 text-primary/20" />
            <Loader2 className="h-6 w-6 text-primary animate-spin absolute top-3 left-3" />
          </div>
          <p className="text-muted-foreground">Loading organization access...</p>
        </div>
      </div>
    );
  }

  // Ensure user is authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check org admin access - allow developers and org admins (including full access users)
  const isDev = isDeveloper();
  const isOrgAdm = isOrgAdmin();
  const hasOrgAccess = isDev || isOrgAdm;
  
  console.log('isDev:', isDev);
  console.log('isOrgAdm:', isOrgAdm);
  console.log('hasOrgAccess:', hasOrgAccess);
  
  // Fallback for known full-access user
  const isFullAccessUser = user?.email === 'huy.nguyen@dcsquared.com.au';
  console.log('isFullAccessUser:', isFullAccessUser);
  
  if (!hasOrgAccess && !isFullAccessUser) {
    console.log('Access denied, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Pass the user's primary organization to the dashboard
  return <OrganizationPanelDashboard organizationId={primaryOrganization} />;
};

export default OrganizationPanel;