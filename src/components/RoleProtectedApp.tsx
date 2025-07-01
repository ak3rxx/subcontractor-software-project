
import React from 'react';
import { useRoleValidation } from '@/hooks/useRoleValidation';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionDataProvider } from '@/permissions';
import RestrictedUserLayout from '@/components/RestrictedUserLayout';

interface RoleProtectedAppProps {
  children: React.ReactNode;
}

const RoleProtectedApp: React.FC<RoleProtectedAppProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { validation, loading: validationLoading, isValid, needsAssignment } = useRoleValidation();

  // Show loading while auth or validation is loading
  if (authLoading || validationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, let the ProtectedRoute handle it
  if (!user) {
    return <>{children}</>;
  }

  // If user has valid role, show normal app with permission context
  if (isValid) {
    return (
      <PermissionDataProvider>
        {children}
      </PermissionDataProvider>
    );
  }

  // If user needs role assignment, show restricted layout
  if (needsAssignment || validation?.validation_status === 'pending_assignment') {
    return <RestrictedUserLayout />;
  }

  // Default to showing normal app with permission context
  return (
    <PermissionDataProvider>
      {children}
    </PermissionDataProvider>
  );
};

export default RoleProtectedApp;
