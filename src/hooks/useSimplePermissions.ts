import { useAuth } from '@/hooks/useAuth';

export const useSimplePermissions = () => {
  const { user, isDeveloper, hasRole, canAccess } = useAuth();
  
  return {
    canAccess: () => !!user,
    canEdit: () => !!user && (isDeveloper() || hasRole('org_admin') || hasRole('project_manager')),
    canAdmin: () => !!user && (isDeveloper() || hasRole('org_admin')),
    canApprove: () => !!user && (isDeveloper() || hasRole('org_admin') || hasRole('project_manager')),
    loading: false
  };
};