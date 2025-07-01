
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, RolePermission, PermissionContext } from '../types';

const PermissionDataContext = createContext<PermissionContext | undefined>(undefined);

interface PermissionDataProviderProps {
  children: ReactNode;
}

export const PermissionDataProvider: React.FC<PermissionDataProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchPermissions();
    } else {
      setUserProfile(null);
      setPermissions([]);
      setLoading(false);
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

  const refetch = () => {
    if (user) {
      fetchUserProfile();
      fetchPermissions();
    }
  };

  const contextValue: PermissionContext = {
    userProfile,
    permissions,
    loading
  };

  return (
    <PermissionDataContext.Provider value={contextValue}>
      {children}
    </PermissionDataContext.Provider>
  );
};

export const usePermissionData = (): PermissionContext => {
  const context = useContext(PermissionDataContext);
  if (context === undefined) {
    throw new Error('usePermissionData must be used within a PermissionDataProvider');
  }
  return context;
};
