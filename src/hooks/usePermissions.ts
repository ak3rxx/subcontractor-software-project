import { useAuth } from '@/hooks/useAuth';

export interface PermissionContext {
  organizationId?: string;
  projectId?: string;
  resourceOwnerId?: string;
}

export const usePermissions = (context?: PermissionContext) => {
  const { user, isDeveloper, hasRole, loading, rolesLoading } = useAuth();

  // Helper to check role with organization context
  const checkRole = (role: string) => hasRole(role, context?.organizationId);

  // Check if user owns the resource
  const isResourceOwner = () => {
    if (!context?.resourceOwnerId || !user) return false;
    return user.id === context.resourceOwnerId;
  };

  // Don't evaluate permissions while roles are loading
  const isReady = !loading && !rolesLoading;

  // Permission matrix based on roles and context
  const permissions = {
    // Loading state
    isReady,
    
    // View permissions (most permissive)
    canView: () => isReady && !!user,
    canViewProjects: () => isReady && !!user,
    canViewVariations: () => isReady && !!user,
    canViewQA: () => isReady && !!user,
    canViewFinance: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    
    // Create permissions
    canCreate: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator') || checkRole('site_supervisor')),
    canCreateProjects: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canCreateVariations: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    canCreateQA: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('site_supervisor')),
    
    // Edit permissions
    canEdit: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator') || isResourceOwner()),
    canEditProjects: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canEditVariations: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    canEditQA: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('site_supervisor')),
    
    // Approval permissions
    canApprove: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canApproveVariations: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canApprovePayments: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Admin permissions
    canAdmin: () => isReady && !!user && (isDeveloper() || checkRole('org_admin')),
    canManageUsers: () => isReady && !!user && (isDeveloper() || checkRole('org_admin')),
    canManageOrganization: () => isReady && !!user && (isDeveloper() || checkRole('org_admin')),
    canManageSettings: () => isReady && !!user && (isDeveloper() || checkRole('org_admin')),
    
    // Delete permissions
    canDelete: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canDeleteProjects: () => isReady && !!user && (isDeveloper() || checkRole('org_admin')),
    canDeleteVariations: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Communication permissions
    canSendEmails: () => isReady && !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canInviteUsers: () => isReady && !!user && (isDeveloper() || checkRole('org_admin')),
    
    // Developer permissions
    canAccessDeveloperTools: () => isReady && isDeveloper(),
    canViewLogs: () => isReady && isDeveloper(),
    canManageFeatureFlags: () => isReady && isDeveloper(),
    
    // Role checks
    isDeveloper: () => isReady && isDeveloper(),
    isOrgAdmin: () => isReady && checkRole('org_admin'),
    isProjectManager: () => isReady && checkRole('project_manager'),
    isEstimator: () => isReady && checkRole('estimator'),
    isSiteSupervisor: () => isReady && checkRole('site_supervisor'),
    isSubcontractor: () => isReady && checkRole('subcontractor'),
    isClient: () => isReady && checkRole('client'),
    
    // Utility
    loading,
    rolesLoading,
    user,
    context
  };

  return permissions;
};

export default usePermissions;