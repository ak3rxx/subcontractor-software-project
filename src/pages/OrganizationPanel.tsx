import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';

const OrganizationPanel: React.FC = () => {
  const { user, isOrgAdmin, primaryOrganization } = useAuth();
  
  // Check if user is an org admin for any organization
  if (!isOrgAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Pass the user's primary organization to the dashboard
  return <OrganizationPanelDashboard organizationId={primaryOrganization} />;
};

export default OrganizationPanel;