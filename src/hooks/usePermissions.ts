
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 
  | 'developer' 
  | 'org_admin' 
  | 'project_manager' 
  | 'estimator' 
  | 'admin' 
  | 'site_supervisor' 
  | 'subcontractor' 
  | 'client';

export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

export type Module = 
  | 'admin_panel'
  | 'organization_panel'
  | 'projects'
  | 'tasks'
  | 'rfis'
  | 'qa_itp'
  | 'variations'
  | 'finance'
  | 'documents'
  | 'programme'
  | 'deliveries'
  | 'handovers'
  | 'notes'
  | 'onboarding'
  | 'diagnostics';

interface UserProfile {
  id: string;
  role: UserRole;
  is_developer: boolean;
  email: string;
  full_name?: string;
  company?: string;
  phone?: string;
}

interface RolePermission {
  role: UserRole;
  module: Module;
  permission_level: PermissionLevel;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchPermissions();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, is_developer, email, full_name, company, phone')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data as UserProfile);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, module, permission_level');

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      setPermissions(data as RolePermission[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (): UserRole => {
    if (userProfile?.is_developer) return 'developer';
    return userProfile?.role || 'client';
  };

  const isDeveloper = (): boolean => {
    return userProfile?.is_developer === true;
  };

  const hasPermission = (module: Module, requiredLevel: PermissionLevel = 'read'): boolean => {
    if (!userProfile) return false;

    // Developers have full access to everything
    if (isDeveloper()) return true;

    const userRole = getUserRole();
    
    // org_admin should have admin access to most modules
    if (userRole === 'org_admin') {
      const adminModules: Module[] = ['projects', 'variations', 'tasks', 'rfis', 'qa_itp', 'finance', 'documents', 'programme', 'deliveries', 'handovers', 'notes'];
      if (adminModules.includes(module)) return true;
    }

    const permission = permissions.find(p => p.role === userRole && p.module === module);
    
    if (!permission) return false;

    const levelHierarchy = ['none', 'read', 'write', 'admin'];
    const userLevelIndex = levelHierarchy.indexOf(permission.permission_level);
    const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
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

  const isOrgAdmin = (): boolean => {
    return getUserRole() === 'org_admin';
  };

  const isProjectManager = (): boolean => {
    return getUserRole() === 'project_manager';
  };

  const getPermissionLevel = (module: Module): PermissionLevel => {
    if (isDeveloper()) return 'admin';
    
    const userRole = getUserRole();
    const permission = permissions.find(p => p.role === userRole && p.module === module);
    return permission?.permission_level || 'none';
  };

  const getAccessibleModules = (): Module[] => {
    if (isDeveloper()) {
      return ['admin_panel', 'organization_panel', 'projects', 'tasks', 'rfis', 'qa_itp', 'variations', 'finance', 'documents', 'programme', 'deliveries', 'handovers', 'notes', 'onboarding', 'diagnostics'];
    }

    const userRole = getUserRole();
    return permissions
      .filter(p => p.role === userRole && p.permission_level !== 'none')
      .map(p => p.module);
  };

  return {
    userProfile,
    userRole: getUserRole(),
    permissions,
    loading,
    hasPermission,
    canAccess,
    canEdit,
    canAdmin,
    isDeveloper,
    isOrgAdmin,
    isProjectManager,
    getPermissionLevel,
    getAccessibleModules,
    refetch: () => {
      fetchUserProfile();
      fetchPermissions();
    }
  };
};
