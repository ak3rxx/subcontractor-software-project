import { useAuth } from '@/hooks/useAuth';

export const useSimplePermissions = (organizationId?: string) => {
  const { user, isDeveloper, hasRole, canAccess, loading } = useAuth();
  
  // Helper to check role with optional organization context
  const checkRole = (role: string) => hasRole(role, organizationId);
  
  return {
    // Basic access
    canAccess: () => !!user,
    canView: () => !!user,
    
    // Creation permissions
    canCreate: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    canCreateProjects: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Edit permissions
    canEdit: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    canEditProjects: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Approval permissions
    canApprove: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canReject: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Admin permissions
    canAdmin: () => !!user && (isDeveloper() || checkRole('org_admin')),
    canManageUsers: () => !!user && (isDeveloper() || checkRole('org_admin')),
    canManageOrganization: () => !!user && (isDeveloper() || checkRole('org_admin')),
    
    // Delete permissions
    canDelete: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Email permissions
    canSendEmails: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Role checks
    isDeveloper: () => isDeveloper(),
    isOrgAdmin: () => checkRole('org_admin'),
    isProjectManager: () => checkRole('project_manager'),
    isEstimator: () => checkRole('estimator'),
    
    loading
  };
};