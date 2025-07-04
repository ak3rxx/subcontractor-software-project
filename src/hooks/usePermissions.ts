import { useAuth } from '@/hooks/useAuth';

export interface PermissionContext {
  organizationId?: string;
  projectId?: string;
  resourceOwnerId?: string;
}

export const usePermissions = (context?: PermissionContext) => {
  const { user, isDeveloper, hasRole, loading } = useAuth();

  // Helper to check role with organization context
  const checkRole = (role: string) => hasRole(role, context?.organizationId);

  // Check if user owns the resource
  const isResourceOwner = () => {
    if (!context?.resourceOwnerId || !user) return false;
    return user.id === context.resourceOwnerId;
  };

  // Permission matrix based on roles and context
  const permissions = {
    // View permissions (most permissive)
    canView: () => !!user,
    canViewProjects: () => !!user,
    canViewVariations: () => !!user,
    canViewQA: () => !!user,
    canViewFinance: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    
    // Create permissions
    canCreate: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator') || checkRole('site_supervisor')),
    canCreateProjects: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canCreateVariations: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    canCreateQA: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('site_supervisor')),
    
    // Edit permissions
    canEdit: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator') || isResourceOwner()),
    canEditProjects: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canEditVariations: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('estimator')),
    canEditQA: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager') || checkRole('site_supervisor')),
    
    // Approval permissions
    canApprove: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canApproveVariations: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canApprovePayments: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Admin permissions
    canAdmin: () => !!user && (isDeveloper() || checkRole('org_admin')),
    canManageUsers: () => !!user && (isDeveloper() || checkRole('org_admin')),
    canManageOrganization: () => !!user && (isDeveloper() || checkRole('org_admin')),
    canManageSettings: () => !!user && (isDeveloper() || checkRole('org_admin')),
    
    // Delete permissions
    canDelete: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canDeleteProjects: () => !!user && (isDeveloper() || checkRole('org_admin')),
    canDeleteVariations: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    
    // Communication permissions
    canSendEmails: () => !!user && (isDeveloper() || checkRole('org_admin') || checkRole('project_manager')),
    canInviteUsers: () => !!user && (isDeveloper() || checkRole('org_admin')),
    
    // Developer permissions
    canAccessDeveloperTools: () => isDeveloper(),
    canViewLogs: () => isDeveloper(),
    canManageFeatureFlags: () => isDeveloper(),
    
    // Role checks
    isDeveloper: () => isDeveloper(),
    isOrgAdmin: () => checkRole('org_admin'),
    isProjectManager: () => checkRole('project_manager'),
    isEstimator: () => checkRole('estimator'),
    isSiteSupervisor: () => checkRole('site_supervisor'),
    isSubcontractor: () => checkRole('subcontractor'),
    isClient: () => checkRole('client'),
    
    // Utility
    loading,
    user,
    context
  };

  return permissions;
};

export default usePermissions;