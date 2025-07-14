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
  const [isDeveloperFlag, setIsDeveloperFlag] = useState(false);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      setIsDeveloperFlag(false);
      return;
    }

    const loadRoles = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load organization roles
        const { data: orgUsers, error: orgError } = await supabase
          .from('organization_users')
          .select(`
            role,
            organization_id,
            organizations!inner(name)
          `)
          .eq('user_id', userId)
          .eq('status', 'active');

        if (orgError) {
          setError(orgError.message);
          setRoles([]);
          return;
        }

        // Load developer status from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_developer')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.warn('Could not load profile:', profileError.message);
        }

        const userRoles: UserRole[] = (orgUsers || []).map(ou => ({
          role: ou.role as UserRole['role'],
          organizationId: ou.organization_id,
          organizationName: (ou.organizations as any)?.name || 'Unknown'
        }));

        setRoles(userRoles);
        setIsDeveloperFlag(profile?.is_developer || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
        setRoles([]);
        setIsDeveloperFlag(false);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [userId]);

  const hasRole = useMemo(() => (role: string, organizationId?: string): boolean => {
    if (!roles.length) return false;
    
    // Developer has access to everything (check actual developer flag)
    if (isDeveloperFlag) return true;
    
    if (organizationId) {
      return roles.some(r => r.role === role && r.organizationId === organizationId);
    }
    
    return roles.some(r => r.role === role);
  }, [roles, isDeveloperFlag]);

  const isOrgAdmin = useMemo(() => (organizationId?: string): boolean => {
    return hasRole('org_admin', organizationId);
  }, [hasRole]);

  const isDeveloper = useMemo(() => (): boolean => {
    return isDeveloperFlag;
  }, [isDeveloperFlag]);

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