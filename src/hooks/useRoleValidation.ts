
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ValidationStatus = 'valid' | 'invalid' | 'unassigned' | 'pending_assignment';

export interface RoleValidation {
  id: string;
  user_id: string;
  validation_status: ValidationStatus;
  organization_id?: string;
  last_validated_at: string;
  notification_sent: boolean;
}

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
}

export const useRoleValidation = () => {
  const [validation, setValidation] = useState<RoleValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchValidation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_role_validation')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching role validation:', error);
        return;
      }

      if (data) {
        setValidation({
          ...data,
          validation_status: data.validation_status as ValidationStatus
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestRoleAssignment = async (requestedRole: string, reason?: string) => {
    if (!user || !validation) return false;

    try {
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!orgUser) {
        toast({
          title: "Error",
          description: "No active organization found",
          variant: "destructive"
        });
        return false;
      }

      const { error } = await supabase
        .from('role_assignment_requests')
        .insert({
          user_id: user.id,
          organization_id: orgUser.organization_id,
          requested_role: requestedRole,
          existing_role: validation.validation_status,
          reason: reason,
          requested_by: user.id
        });

      if (error) {
        console.error('Error creating role request:', error);
        toast({
          title: "Error",
          description: "Failed to submit role request",
          variant: "destructive"
        });
        return false;
      }

      // Note: Validation status update should be handled by admin/system
      console.log('Role assignment request submitted - validation status should be updated by admin');

      toast({
        title: "Success",
        description: "Role assignment request submitted successfully"
      });

      fetchValidation();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const validateCurrentRole = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !profile.role) {
        console.log('No profile or role found for user');
        return;
      }

      const validRoles = ['developer', 'org_admin', 'project_manager', 'estimator', 'admin', 'site_supervisor', 'subcontractor', 'client'];
      const isValid = validRoles.includes(profile.role);

      console.log('Role validation check:', profile.role, 'isValid:', isValid);

      // Just fetch the current validation status - don't try to update it
      fetchValidation();
    } catch (error) {
      console.error('Error validating role:', error);
    }
  };

  useEffect(() => {
    fetchValidation();
  }, [user]);

  // Check if user has a valid role in their profile
  const hasValidRoleInProfile = async () => {
    if (!user) return false;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile?.role) return false;

      const validRoles = ['developer', 'org_admin', 'project_manager', 'estimator', 'admin', 'site_supervisor', 'subcontractor', 'client'];
      return validRoles.includes(profile.role);
    } catch (error) {
      console.error('Error checking profile role:', error);
      return false;
    }
  };

  return {
    validation,
    loading,
    requestRoleAssignment,
    validateCurrentRole,
    refetch: fetchValidation,
    isValid: validation?.validation_status === 'valid',
    needsAssignment: validation?.validation_status === 'invalid' || validation?.validation_status === 'unassigned',
    hasValidRoleInProfile
  };
};
