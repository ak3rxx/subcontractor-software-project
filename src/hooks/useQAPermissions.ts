import { useAuth } from '@/hooks/useAuth';

export interface QAPermissions {
  canCreateInspections: boolean;
  canEditInspections: boolean;
  canDeleteInspections: boolean;
  canViewInspections: boolean;
  canManageTemplates: boolean;
  canViewAuditTrail: boolean;
  canBulkOperations: boolean;
  denialReason?: string;
}

export const useQAPermissions = (organizationId?: string): QAPermissions => {
  const { user, isDeveloper, hasRole, loading } = useAuth();
  
  // Helper to check role with optional organization context
  const checkRole = (role: string) => hasRole(role, organizationId);
  
  if (!user) {
    return {
      canCreateInspections: false,
      canEditInspections: false,
      canDeleteInspections: false,
      canViewInspections: false,
      canManageTemplates: false,
      canViewAuditTrail: false,
      canBulkOperations: false,
      denialReason: 'You must be logged in to access QA inspections.'
    };
  }

  // Role-based permissions
  const isOrgAdmin = checkRole('org_admin');
  const isProjectManager = checkRole('project_manager');
  const isEstimator = checkRole('estimator');
  const isSupervisor = checkRole('site_supervisor');
  const isAdmin = checkRole('admin');

  // Determine permissions based on roles
  const canCreateInspections = isDeveloper() || isOrgAdmin || isProjectManager || isEstimator || isSupervisor || isAdmin;
  const canEditInspections = isDeveloper() || isOrgAdmin || isProjectManager || isEstimator || isSupervisor || isAdmin;
  const canDeleteInspections = isDeveloper() || isOrgAdmin || isProjectManager || isAdmin;
  const canViewInspections = !!user; // All authenticated users can view
  const canManageTemplates = isDeveloper() || isOrgAdmin || isProjectManager || isAdmin;
  const canViewAuditTrail = isDeveloper() || isOrgAdmin || isProjectManager || isEstimator || isAdmin;
  const canBulkOperations = isDeveloper() || isOrgAdmin || isProjectManager || isAdmin;

  // Generate denial reason for edit permissions
  let denialReason = '';
  if (!canEditInspections) {
    denialReason = 'You need Project Manager, Estimator, Site Supervisor, or Organization Admin role to edit QA inspections.';
  }

  return {
    canCreateInspections,
    canEditInspections,
    canDeleteInspections,
    canViewInspections,
    canManageTemplates,
    canViewAuditTrail,
    canBulkOperations,
    denialReason
  };
};