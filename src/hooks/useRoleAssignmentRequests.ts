
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface RoleAssignmentRequest {
  id: string;
  user_id: string;
  organization_id: string;
  requested_role?: string;
  existing_role?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  requested_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user_profile?: {
    full_name?: string;
    email?: string;
  };
}

export const useRoleAssignmentRequests = () => {
  const [requests, setRequests] = useState<RoleAssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = async () => {
    if (!user) return;

    try {
      // Get organization where user is org_admin
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('role', 'org_admin')
        .single();

      if (!orgUser) {
        setRequests([]);
        return;
      }

      // Get role assignment requests for this organization
      const { data: requestsData, error } = await supabase
        .from('role_assignment_requests')
        .select(`
          *,
          profiles!role_assignment_requests_user_id_fkey (
            full_name,
            email
          )
        `)
        .eq('organization_id', orgUser.organization_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching role requests:', error);
        return;
      }

      const transformedRequests = (requestsData || []).map(request => ({
        ...request,
        user_profile: request.profiles ? {
          full_name: request.profiles.full_name,
          email: request.profiles.email
        } : undefined
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string, newRole: string) => {
    if (!user) return false;

    try {
      // Get the request details first
      const request = requests.find(r => r.id === requestId);
      if (!request) return false;

      // Update the user's profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', request.user_id);

      if (profileError) {
        console.error('Error updating profile role:', profileError);
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive"
        });
        return false;
      }

      // Update the role assignment request
      const { error: requestError } = await supabase
        .from('role_assignment_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (requestError) {
        console.error('Error updating request:', requestError);
        return false;
      }

      // Update the user's validation status
      await supabase
        .from('user_role_validation')
        .update({
          validation_status: 'valid',
          last_validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.user_id);

      toast({
        title: "Success",
        description: `Role assignment approved. User now has ${newRole} access.`
      });

      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      return false;
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('role_assignment_requests')
        .update({
          status: 'rejected',
          approved_by: user.id,
          reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        toast({
          title: "Error",
          description: "Failed to reject request",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Request Rejected",
        description: "Role assignment request has been rejected"
      });

      fetchRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  return {
    requests,
    loading,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
    pendingCount: requests.filter(r => r.status === 'pending').length
  };
};
