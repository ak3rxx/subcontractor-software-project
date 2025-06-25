
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Navigate } from 'react-router-dom';
import DeveloperAdminDashboard from '@/components/admin/DeveloperAdminDashboard';

const DeveloperAdmin: React.FC = () => {
  const { isDeveloper, loading } = usePermissions();

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

  if (!isDeveloper()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <DeveloperAdminDashboard />;
};

export default DeveloperAdmin;
