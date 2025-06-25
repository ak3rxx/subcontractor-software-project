
import React from 'react';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import OrganizationPanelDashboard from '@/components/organization/OrganizationPanelDashboard';

const OrganizationPanel: React.FC = () => {
  return (
    <RoleProtectedRoute module="organization_panel" requiredLevel="admin">
      <OrganizationPanelDashboard />
    </RoleProtectedRoute>
  );
};

export default OrganizationPanel;
