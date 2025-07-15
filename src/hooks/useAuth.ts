import { useSimpleAuth } from './useSimpleAuth';
import { useUserRoles, UserRole } from './useUserRoles';

export interface AuthUser {
  id: string;
  email?: string;
  roles?: UserRole[];
  primaryRole?: string;
  primaryOrganization?: string;
  user_metadata?: any;
}

// Enhanced auth hook that combines simple auth with roles when needed
export const useAuth = () => {
  const { user: authUser, loading: authLoading, ...authMethods } = useSimpleAuth();
  const { roles, loading: rolesLoading, ...roleMethods } = useUserRoles(authUser?.id);

  const user: AuthUser | null = authUser ? {
    id: authUser.id,
    email: authUser.email,
    roles,
    primaryRole: roles[0]?.role,
    primaryOrganization: roles[0]?.organizationId,
    user_metadata: (authUser as any).user_metadata || {}
  } : null;

  // Only show loading if auth is loading (not roles)
  const loading = authLoading;


  return {
    user,
    loading,
    rolesLoading,
    ...roleMethods,
    ...authMethods,
    // Legacy compatibility
    canCreateVariations: () => !!user,
    canEditVariations: () => !!user,
    canSendEmails: () => roleMethods.isDeveloper() || roleMethods.hasRole('org_admin'),
    canViewVariations: () => !!user
  };
};