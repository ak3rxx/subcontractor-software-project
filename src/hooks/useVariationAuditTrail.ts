
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

export const useVariationAuditTrail = (variationId?: string) => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAuditTrail = async () => {
    if (!variationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_variation_audit_history', { p_variation_id: variationId });

      if (error) {
        console.error('Error fetching audit trail:', error);
        toast({
          title: "Error",
          description: "Failed to load audit history",
          variant: "destructive"
        });
        return;
      }

      setAuditTrail(data || []);
    } catch (error) {
      console.error('Error:', error);
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
    if (!variationId || !user) return;

    try {
      const { error } = await supabase
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
