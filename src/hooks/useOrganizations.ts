
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
      // Create invitation record first
      const { data: invitationData, error: inviteError } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          email,
          role,
          invited_by: user?.id
        })
        .select('invitation_token, organizations(name)')
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        toast({
          title: "Error",
          description: "Failed to create invitation",
          variant: "destructive"
        });
        return false;
      }

      // Get user profile for invited_by name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user?.id)
        .single();

      // Send invitation email via Edge Function
      try {
        const { data, error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email,
            organizationName: (invitationData.organizations as any)?.name || 'Your Organization',
            role,
            invitedByName: profileData?.full_name || profileData?.email || 'A team member',
            invitationToken: invitationData.invitation_token,
            baseUrl: window.location.origin
          }
        });

        if (emailError) {
          console.error('Error sending invitation email:', emailError);
          // Don't fail the whole process if email fails
          toast({
            title: "Invitation Created",
            description: "Invitation created but email failed to send. Please share the invitation link manually.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: `Invitation sent to ${email}`
          });
        }
      } catch (emailError) {
        console.error('Email service error:', emailError);
        toast({
          title: "Invitation Created",
          description: "Invitation created but email service is unavailable.",
          variant: "destructive"
        });
      }

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to invite user",
        variant: "destructive"
      });
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

  const resendInvitation = async (invitationId: string, email: string) => {
    try {
      // Get the existing invitation details
      const { data: invitationData, error: fetchError } = await supabase
        .from('organization_invitations')
        .select(`
          organization_id,
          role,
          organizations(name),
          profiles!organization_invitations_invited_by_fkey(full_name, email)
        `)
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitationData) {
        console.error('Error fetching invitation:', fetchError);
        toast({
          title: "Error",
          description: "Failed to find invitation details",
          variant: "destructive"
        });
        return false;
      }

      // Extend the expiration date by 3 more days
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 3);

      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({ 
          expires_at: newExpiryDate.toISOString(),
          status: 'pending' // Reset status in case it was changed
        })
        .eq('id', invitationId);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        toast({
          title: "Error",
          description: "Failed to extend invitation",
          variant: "destructive"
        });
        return false;
      }

      // Get the invitation token for the email
      const { data: tokenData, error: tokenError } = await supabase
        .from('organization_invitations')
        .select('invitation_token')
        .eq('id', invitationId)
        .single();

      if (tokenError || !tokenData) {
        console.error('Error getting invitation token:', tokenError);
        toast({
          title: "Error",
          description: "Failed to get invitation token",
          variant: "destructive"
        });
        return false;
      }

      // Resend the invitation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            email,
            organizationName: (invitationData.organizations as any)?.name || 'Your Organization',
            role: invitationData.role,
            invitedByName: (invitationData.profiles as any)?.full_name || (invitationData.profiles as any)?.email || 'A team member',
            invitationToken: tokenData.invitation_token,
            baseUrl: window.location.origin
          }
        });

        if (emailError) {
          console.error('Error resending invitation email:', emailError);
          toast({
            title: "Invitation Extended",
            description: "Invitation was extended but email failed to send",
            variant: "destructive"
          });
          return false;
        }

        toast({
          title: "Success",
          description: `Invitation resent to ${email} and extended for 3 more days`
        });
        return true;

      } catch (emailError) {
        console.error('Email service error:', emailError);
        toast({
          title: "Invitation Extended",
          description: "Invitation extended but email service is unavailable",
          variant: "destructive"
        });
        return false;
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('Error deleting invitation:', error);
        toast({
          title: "Error",
          description: "Failed to delete invitation",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success",
        description: `Invitation for ${email} has been deleted`
      });

      return true;
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive"
      });
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
    resendInvitation,
    deleteInvitation,
    refetch: fetchUserOrganizations
  };
};
