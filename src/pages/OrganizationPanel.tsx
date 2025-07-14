import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';
import { Loader2, Building2 } from 'lucide-react';

const OrganizationPanel: React.FC = () => {
  const { user, loading, rolesLoading, isOrgAdmin, primaryOrganization } = useAuth();
  const { toast } = useToast();
  const [accessDenied, setAccessDenied] = useState(false);
  
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

  // Check access and show toast only once
  useEffect(() => {
    if (!loading && !rolesLoading && !accessDenied) {
      const hasOrgAdminAccess = isOrgAdmin();
      if (!hasOrgAdminAccess) {
        toast({
          title: "Access Denied",
          description: "Organization admin role required to access this panel.",
          variant: "destructive",
        });
        setAccessDenied(true);
      }
    }
  }, [loading, rolesLoading, accessDenied]);

  // Redirect if access is denied
  if (!loading && !rolesLoading && !isOrgAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Pass the user's primary organization to the dashboard
  return <OrganizationPanelDashboard organizationId={primaryOrganization} />;
};

export default OrganizationPanel;