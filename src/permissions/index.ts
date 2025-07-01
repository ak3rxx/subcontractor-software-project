
// Main exports for the permission system
export * from './types';
export * from './utils';
export { usePermissionChecks } from './hooks/usePermissionChecks';
export { PermissionDataProvider, usePermissionData } from './providers/PermissionDataProvider';
export { PermissionGate } from './components/PermissionGate';
export { RoleProtectedRoute } from './components/RoleProtectedRoute';

// Legacy compatibility - re-export as usePermissions for backward compatibility
export { usePermissionChecks as usePermissions } from './hooks/usePermissionChecks';
