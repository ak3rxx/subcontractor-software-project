import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

export interface QAPermissions {
  canCreateInspections: boolean;
  canEditInspections: boolean;
  canDeleteInspections: boolean;
  canViewInspections: boolean;
  canManageTemplates: boolean;
  canViewAuditTrail: boolean;
  canBulkOperations: boolean;
}

export const useQAPermissions = (): QAPermissions => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  if (!user) {
    return {
      canCreateInspections: false,
      canEditInspections: false,
      canDeleteInspections: false,
      canViewInspections: false,
      canManageTemplates: false,
      canViewAuditTrail: false,
      canBulkOperations: false
    };
  }

  // Define role-based permissions
  const canCreateInspections = hasPermission('qa_itp', 'admin') || hasPermission('qa_itp', 'write') ||
    ['project_manager', 'site_supervisor', 'admin'].includes(user.role || '');

  const canEditInspections = hasPermission('qa_itp', 'admin') || hasPermission('qa_itp', 'write') ||
    ['project_manager', 'site_supervisor', 'admin'].includes(user.role || '');

  const canDeleteInspections = hasPermission('qa_itp', 'admin') || 
    ['project_manager', 'admin'].includes(user.role || '');

  const canViewInspections = hasPermission('qa_itp', 'read') || hasPermission('qa_itp', 'write') || hasPermission('qa_itp', 'admin') ||
    ['project_manager', 'site_supervisor', 'admin', 'subcontractor'].includes(user.role || '');

  const canManageTemplates = hasPermission('qa_itp', 'admin') || 
    ['project_manager', 'admin'].includes(user.role || '');

  const canViewAuditTrail = hasPermission('qa_itp', 'admin') || 
    ['project_manager', 'admin'].includes(user.role || '');

  const canBulkOperations = hasPermission('qa_itp', 'admin') || 
    ['project_manager', 'admin'].includes(user.role || '');

  return {
    canCreateInspections,
    canEditInspections,
    canDeleteInspections,
    canViewInspections,
    canManageTemplates,
    canViewAuditTrail,
    canBulkOperations
  };
};