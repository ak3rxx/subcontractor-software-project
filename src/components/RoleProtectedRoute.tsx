
import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, Module, PermissionLevel } from '@/hooks/usePermissions';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  module: Module;
  requiredLevel?: PermissionLevel;
  redirectTo?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  module,
  requiredLevel = 'read',
  redirectTo = '/dashboard'
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission(module, requiredLevel)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
