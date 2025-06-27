
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AuditTrailEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: 'create' | 'edit' | 'submit' | 'approve' | 'reject' | 'unlock' | 'email_sent';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  status_from?: string;
  status_to?: string;
  comments?: string;
  metadata: any;
  action_timestamp: string;
}

// Database response interface
interface DatabaseAuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  status_from?: string;
  status_to?: string;
  comments?: string;
  metadata: any;
  action_timestamp: string;
}

// Helper function to validate and transform database response
const transformAuditEntry = (dbEntry: DatabaseAuditEntry): AuditTrailEntry => {
  const validActionTypes = ['create', 'edit', 'submit', 'approve', 'reject', 'unlock', 'email_sent'];
  const actionType = validActionTypes.includes(dbEntry.action_type) 
    ? dbEntry.action_type as AuditTrailEntry['action_type']
    : 'edit'; // fallback to 'edit' for invalid types

  return {
    id: dbEntry.id,
    user_id: dbEntry.user_id,
    user_name: dbEntry.user_name,
    action_type: actionType,
    field_name: dbEntry.field_name,
    old_value: dbEntry.old_value,
    new_value: dbEntry.new_value,
    status_from: dbEntry.status_from,
    status_to: dbEntry.status_to,
    comments: dbEntry.comments,
    metadata: dbEntry.metadata,
    action_timestamp: dbEntry.action_timestamp
  };
};

export const useVariationAuditTrail = (variationId?: string) => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAuditTrail = async () => {
    if (!variationId) return;

    setLoading(true);
    try {
      console.log('Fetching audit trail for variation:', variationId);
      
      const { data, error } = await supabase
        .rpc('get_variation_audit_history', { p_variation_id: variationId });

      if (error) {
        console.error('Error fetching audit trail:', error);
        toast({
          title: "Error",
          description: "Failed to load approval history",
          variant: "destructive"
        });
        return;
      }

      console.log('Raw audit trail data:', data);

      // Transform the database response to match our TypeScript interface
      const transformedData = (data || []).map((entry: DatabaseAuditEntry) => 
        transformAuditEntry(entry)
      );
      
      console.log('Transformed audit trail data:', transformedData);
      setAuditTrail(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load approval history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logAuditEntry = async (
    actionType: AuditTrailEntry['action_type'],
    options: {
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      statusFrom?: string;
      statusTo?: string;
      comments?: string;
      metadata?: any;
    } = {}
  ) => {
    if (!variationId || !user) {
      console.warn('Cannot log audit entry: missing variationId or user');
      return;
    }

    try {
      console.log('Logging audit entry:', {
        variationId,
        userId: user.id,
        actionType,
        options
      });

      const { data, error } = await supabase
        .rpc('log_variation_change', {
          p_variation_id: variationId,
          p_user_id: user.id,
          p_action_type: actionType,
          p_field_name: options.fieldName,
          p_old_value: options.oldValue,
          p_new_value: options.newValue,
          p_status_from: options.statusFrom,
          p_status_to: options.statusTo,
          p_comments: options.comments,
          p_metadata: options.metadata || {}
        });

      if (error) {
        console.error('Error logging audit entry:', error);
        toast({
          title: "Warning",
          description: "Failed to log approval history entry",
          variant: "destructive"
        });
      } else {
        console.log('Audit entry logged successfully:', data);
        // Refresh the audit trail to show the new entry
        setTimeout(() => fetchAuditTrail(), 500);
      }
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  };

  useEffect(() => {
    if (variationId) {
      fetchAuditTrail();
    }
  }, [variationId]);

  return {
    auditTrail,
    loading,
    fetchAuditTrail,
    logAuditEntry,
    refetch: fetchAuditTrail
  };
};
