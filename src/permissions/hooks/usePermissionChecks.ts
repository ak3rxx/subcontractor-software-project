
import { Module, PermissionLevel } from '../types';
import { hasPermissionLevel, getPermissionLevel, getAccessibleModules, isDeveloper, isOrgAdmin, isProjectManager, getUserRole } from '../utils';
import { usePermissionData } from '../providers/PermissionDataProvider';

export const usePermissionChecks = () => {
  const { userProfile, permissions, loading } = usePermissionData();

  const hasPermission = (module: Module, requiredLevel: PermissionLevel = 'read'): boolean => {
    return hasPermissionLevel(userProfile, permissions, module, requiredLevel);
  };

  const canAccess = (module: Module): boolean => {
    return hasPermission(module, 'read');
  };

  const canEdit = (module: Module): boolean => {
    return hasPermission(module, 'write');
  };

  const canAdmin = (module: Module): boolean => {
    return hasPermission(module, 'admin');
  };

  const getLevel = (module: Module): PermissionLevel => {
    return getPermissionLevel(userProfile, permissions, module);
  };

  const getAccessible = (): Module[] => {
    return getAccessibleModules(userProfile, permissions);
  };

  return {
    // Core permission checks
    hasPermission,
    canAccess,
    canEdit,
    canAdmin,
    getPermissionLevel: getLevel,
    getAccessibleModules: getAccessible,
    
    // Role checks
    isDeveloper: () => isDeveloper(userProfile),
    isOrgAdmin: () => isOrgAdmin(userProfile),
    isProjectManager: () => isProjectManager(userProfile),
    
    // User info
    userRole: getUserRole(userProfile),
    userProfile,
    permissions,
    loading
  };
};
