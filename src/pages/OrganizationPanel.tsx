import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';
import { Loader2, Building2 } from 'lucide-react';

const OrganizationPanel: React.FC = () => {
  const { user, loading, rolesLoading, isOrgAdmin, primaryOrganization } = useAuth();
  
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

  // Redirect if no access
  if (!isOrgAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Pass the user's primary organization to the dashboard
  return <OrganizationPanelDashboard organizationId={primaryOrganization} />;
};

export default OrganizationPanel;