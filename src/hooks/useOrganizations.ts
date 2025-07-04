
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
type OrganizationUsersRow = Database['public']['Tables']['organization_users']['Row'];

export interface Organization {
  id: string;
  name: string;
  slug: string;
  license_count: number;
  active_users_count: number;
  subscription_status: 'active' | 'inactive' | 'trial' | 'expired';
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joined_at: string;
  user_profile?: {
    full_name?: string;
    email?: string;
  };
}

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false to not block UI
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchUserOrganizations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data: orgUsers, error } = await supabase
        .from('organization_users')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching organizations:', error);
        // Don't show error toast as organization is optional
        return;
      }

      const orgs = orgUsers?.map(ou => ou.organizations).filter(Boolean) as Organization[];
      setOrganizations(orgs || []);
      
      // Set first organization as current if none is set
      if (orgs && orgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(orgs[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationUsers = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching organization users:', error);
        return;
      }

      const users = data?.map(ou => ({
        ...ou,
        user_profile: ou.profiles
      })) as OrganizationUser[];

      setOrganizationUsers(users || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const inviteUser = async (organizationId: string, email: string, role: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: user?.id
        });

      if (error) {
        console.error('Error inviting user:', error);
        toast({
          title: "Error",
          description: "Failed to invite user",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${email}`
      });

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const updateUserRole = async (organizationUserId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ role: newRole })
        .eq('id', organizationUserId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: "User role updated successfully"
      });

      // Refresh organization users
      if (currentOrganization) {
        fetchOrganizationUsers(currentOrganization.id);
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrganizations();
    }
  }, [user]);

  useEffect(() => {
    if (currentOrganization) {
      fetchOrganizationUsers(currentOrganization.id);
    }
  }, [currentOrganization]);

  return {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    organizationUsers,
    loading,
    inviteUser,
    updateUserRole,
    refetch: fetchUserOrganizations
  };
};
