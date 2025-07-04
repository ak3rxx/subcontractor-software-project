import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  role: 'developer' | 'org_admin' | 'project_manager' | 'estimator' | 'admin' | 'site_supervisor' | 'subcontractor' | 'client';
  organizationId: string;
  organizationName: string;
}

// Hook for loading user roles only when needed
export const useUserRoles = (userId: string | undefined) => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const loadRoles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data: orgUsers, error } = await supabase
          .from('organization_users')
          .select(`
            role,
            organization_id,
            organizations!inner(name)
          `)
          .eq('user_id', userId)
          .eq('status', 'active');

        if (error) {
          setError(error.message);
          setRoles([]);
          return;
        }

        const userRoles: UserRole[] = (orgUsers || []).map(ou => ({
          role: ou.role as UserRole['role'],
          organizationId: ou.organization_id,
          organizationName: (ou.organizations as any)?.name || 'Unknown'
        }));

        setRoles(userRoles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [userId]);

  const hasRole = useMemo(() => (role: string, organizationId?: string): boolean => {
    if (!roles.length) return false;
    
    // Developer has access to everything
    if (roles.some(r => r.role === 'developer')) return true;
    
    if (organizationId) {
      return roles.some(r => r.role === role && r.organizationId === organizationId);
    }
    
    return roles.some(r => r.role === role);
  }, [roles]);

  const isOrgAdmin = useMemo(() => (organizationId?: string): boolean => {
    return hasRole('org_admin', organizationId);
  }, [hasRole]);

  const isDeveloper = useMemo(() => (): boolean => {
    return hasRole('developer');
  }, [hasRole]);

  const canAccess = useMemo(() => (module: string): boolean => {
    if (!roles.length) return false;
    if (isDeveloper()) return true;
    
    // Simple access control - authenticated users can access most modules
    const restrictedModules = ['admin_panel', 'organization_panel', 'developer_admin'];
    
    if (restrictedModules.includes(module)) {
      if (module === 'developer_admin') return isDeveloper();
      if (module === 'admin_panel' || module === 'organization_panel') {
        return isDeveloper() || hasRole('org_admin');
      }
    }
    
    return true;
  }, [roles, hasRole, isDeveloper]);

  return {
    roles,
    loading,
    error,
    hasRole,
    isOrgAdmin,
    isDeveloper,
    canAccess,
    primaryRole: roles[0]?.role,
    primaryOrganization: roles[0]?.organizationId
  };
};