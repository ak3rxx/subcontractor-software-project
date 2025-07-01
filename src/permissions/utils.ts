
import { UserRole, PermissionLevel, Module, UserProfile, RolePermission } from './types';

export const PERMISSION_HIERARCHY: PermissionLevel[] = ['none', 'read', 'write', 'admin'];

export const getAllModules = (): Module[] => [
  'admin_panel', 'organization_panel', 'projects', 'tasks', 'rfis', 
  'qa_itp', 'variations', 'finance', 'documents', 'programme', 
  'deliveries', 'handovers', 'notes', 'onboarding', 'diagnostics'
];

export const getUserRole = (userProfile: UserProfile | null): UserRole => {
  if (userProfile?.is_developer) return 'developer';
  return userProfile?.role || 'client';
};

export const isDeveloper = (userProfile: UserProfile | null): boolean => {
  return userProfile?.is_developer === true;
};

export const isOrgAdmin = (userProfile: UserProfile | null): boolean => {
  return getUserRole(userProfile) === 'org_admin';
};

export const isProjectManager = (userProfile: UserProfile | null): boolean => {
  return getUserRole(userProfile) === 'project_manager';
};

export const hasPermissionLevel = (
  userProfile: UserProfile | null,
  permissions: RolePermission[],
  module: Module,
  requiredLevel: PermissionLevel = 'read'
): boolean => {
  if (!userProfile) return false;

  // Developers have FULL access to everything
  if (isDeveloper(userProfile)) return true;

  const userRole = getUserRole(userProfile);
  
  // org_admin should have admin access to most modules
  if (userRole === 'org_admin') {
    const adminModules: Module[] = [
      'projects', 'variations', 'tasks', 'rfis', 'qa_itp', 
      'finance', 'documents', 'programme', 'deliveries', 
      'handovers', 'notes'
    ];
    if (adminModules.includes(module)) return true;
  }

  const permission = permissions.find(p => p.role === userRole && p.module === module);
  if (!permission) return false;

  const userLevelIndex = PERMISSION_HIERARCHY.indexOf(permission.permission_level);
  const requiredLevelIndex = PERMISSION_HIERARCHY.indexOf(requiredLevel);

  return userLevelIndex >= requiredLevelIndex;
};

export const getPermissionLevel = (
  userProfile: UserProfile | null,
  permissions: RolePermission[],
  module: Module
): PermissionLevel => {
  if (isDeveloper(userProfile)) return 'admin';
  
  const userRole = getUserRole(userProfile);
  const permission = permissions.find(p => p.role === userRole && p.module === module);
  return permission?.permission_level || 'none';
};

export const getAccessibleModules = (
  userProfile: UserProfile | null,
  permissions: RolePermission[]
): Module[] => {
  if (isDeveloper(userProfile)) return getAllModules();

  const userRole = getUserRole(userProfile);
  return permissions
    .filter(p => p.role === userRole && p.permission_level !== 'none')
    .map(p => p.module);
};
