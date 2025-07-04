import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  role: 'developer' | 'org_admin' | 'project_manager' | 'estimator' | 'admin' | 'site_supervisor' | 'subcontractor' | 'client';
  organizationId: string;
  organizationName: string;
}

export interface AuthUser extends User {
  roles?: UserRole[];
  primaryRole?: string;
  primaryOrganization?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserWithRoles(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserWithRoles(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserWithRoles = async (authUser: User) => {
    try {
      // Get user's organization memberships
      const { data: orgUsers, error } = await supabase
        .from('organization_users')
        .select(`
          role,
          organization_id,
          organizations!inner(name)
        `)
        .eq('user_id', authUser.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error loading user roles:', error);
        setUser(authUser as AuthUser);
        setLoading(false);
        return;
      }

      const roles: UserRole[] = (orgUsers || []).map(ou => ({
        role: ou.role as UserRole['role'],
        organizationId: ou.organization_id,
        organizationName: (ou.organizations as any)?.name || 'Unknown'
      }));

      const enrichedUser: AuthUser = {
        ...authUser,
        roles,
        primaryRole: roles[0]?.role,
        primaryOrganization: roles[0]?.organizationId
      };

      setUser(enrichedUser);
    } catch (error) {
      console.error('Error loading user roles:', error);
      setUser(authUser as AuthUser);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string, organizationId?: string): boolean => {
    if (!user?.roles) return false;
    
    // Developer has access to everything
    if (user.roles.some(r => r.role === 'developer')) return true;
    
    if (organizationId) {
      return user.roles.some(r => r.role === role && r.organizationId === organizationId);
    }
    
    return user.roles.some(r => r.role === role);
  };

  const isOrgAdmin = (organizationId?: string): boolean => {
    return hasRole('org_admin', organizationId);
  };

  const isDeveloper = (): boolean => {
    return hasRole('developer');
  };

  const canAccess = (module: string): boolean => {
    if (!user) return false;
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
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    loading,
    hasRole,
    isOrgAdmin,
    isDeveloper,
    canAccess,
    signOut,
    // Legacy compatibility
    canCreateVariations: () => !!user,
    canEditVariations: () => !!user,
    canSendEmails: () => isDeveloper() || hasRole('org_admin'),
    canViewVariations: () => !!user
  };
};