
import React from 'react';
import { usePermissions, Module, PermissionLevel } from '@/hooks/usePermissions';

interface PermissionGateProps {
  module: Module;
  requiredLevel?: PermissionLevel;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  requiredLevel = 'read',
  fallback = null,
  children
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  if (!hasPermission(module, requiredLevel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
