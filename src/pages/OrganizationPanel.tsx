import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';

const OrganizationPanel: React.FC = () => {
  const { user } = useAuth();
  
  // Simple org admin check - can be expanded later
  const isOrgAdmin = () => user?.email === 'huy.nguyen@dcsquared.com.au';
  
  if (!isOrgAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OrganizationPanelDashboard />;
};

export default OrganizationPanel;