import React from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PermissionGateProps {
  role?: string;
  organizationId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  role,
  organizationId,
  fallback = null,
  children
}) => {
  const { user, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role, organizationId)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;