import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  role?: string;
  permission?: 'view' | 'edit' | 'admin' | 'create' | 'delete' | 'approve';
  organizationId?: string;
  fallback?: React.ReactNode;
  showMessage?: boolean;
  message?: string;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  role,
  permission,
  organizationId,
  fallback = null,
  showMessage = false,
  message,
  children
}) => {
  const { user, hasRole, isDeveloper, loading } = useAuth();

  if (loading) {
    return <div className="animate-pulse bg-muted h-4 w-full rounded"></div>;
  }

  if (!user) {
    if (showMessage) {
      return (
        <Alert className="border-destructive/50 text-destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {message || 'You must be logged in to access this feature.'}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check role-based permissions
  if (role && !hasRole(role, organizationId)) {
    if (showMessage) {
      return (
        <Alert className="border-destructive/50 text-destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {message || `This feature requires ${role} permissions.`}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check permission-level access
  if (permission && !checkPermissionLevel(permission, { user, hasRole, isDeveloper, organizationId })) {
    if (showMessage) {
      return (
        <Alert className="border-destructive/50 text-destructive">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            {message || `You don't have ${permission} permissions for this action.`}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Helper function to check permission levels
const checkPermissionLevel = (
  permission: string,
  { user, hasRole, isDeveloper, organizationId }: any
): boolean => {
  if (!user) return false;
  if (isDeveloper()) return true; // Developers have all permissions

  switch (permission) {
    case 'view':
      return true; // All authenticated users can view
    case 'create':
    case 'edit':
      return hasRole('org_admin', organizationId) || 
             hasRole('project_manager', organizationId) ||
             hasRole('estimator', organizationId);
    case 'approve':
      return hasRole('org_admin', organizationId) || 
             hasRole('project_manager', organizationId);
    case 'admin':
      return hasRole('org_admin', organizationId);
    case 'delete':
      return hasRole('org_admin', organizationId) || 
             hasRole('project_manager', organizationId);
    default:
      return false;
  }
};

export default PermissionGate;