
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import EnhancedDeveloperAdminDashboard from '@/components/admin/EnhancedDeveloperAdminDashboard';

const DeveloperAdmin: React.FC = () => {
  const { user, loading } = useAuth();
  const isDeveloper = () => user?.email === 'huy.nguyen@dcsquared.com.au';

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

  return <EnhancedDeveloperAdminDashboard />;
};

export default DeveloperAdmin;
