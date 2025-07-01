
import React from 'react';
import { Module, PermissionLevel } from '../types';
import { usePermissionChecks } from '../hooks/usePermissionChecks';

interface PermissionGateProps {
  module: Module;
  requiredLevel?: PermissionLevel;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  module,
  requiredLevel = 'read',
  fallback = null,
  children
}) => {
  const { hasPermission, loading } = usePermissionChecks();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  if (!hasPermission(module, requiredLevel)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
