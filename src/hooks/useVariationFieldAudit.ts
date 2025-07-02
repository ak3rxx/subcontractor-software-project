import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVariationFieldAudit = () => {
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const logFieldChanges = async (
    variationId: string,
    originalData: any,
    updatedData: any,
    actionType: 'edit' | 'status_change' = 'edit'
  ) => {
    setIsLogging(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fieldsToTrack = [
        'title', 'description', 'location', 'cost_impact', 'time_impact', 
        'category', 'priority', 'client_email', 'justification', 'trade',
        'gst_amount', 'total_amount', 'requires_eot', 'requires_nod'
      ];

      const auditEntries = [];

      for (const field of fieldsToTrack) {
        const oldValue = originalData[field];
        const newValue = updatedData[field];

        // Check if the field has actually changed
        if (oldValue !== newValue) {
          auditEntries.push({
            p_variation_id: variationId,
            p_user_id: user.id,
            p_action_type: actionType,
            p_field_name: field,
            p_old_value: oldValue?.toString() || '',
            p_new_value: newValue?.toString() || '',
            p_comments: `Field "${field}" changed from "${oldValue || 'empty'}" to "${newValue || 'empty'}"`
          });
        }
      }

      // Log cost breakdown changes if present
      if (JSON.stringify(originalData.cost_breakdown) !== JSON.stringify(updatedData.cost_breakdown)) {
        auditEntries.push({
          p_variation_id: variationId,
          p_user_id: user.id,
          p_action_type: actionType,
          p_field_name: 'cost_breakdown',
          p_old_value: JSON.stringify(originalData.cost_breakdown || []),
          p_new_value: JSON.stringify(updatedData.cost_breakdown || []),
          p_comments: 'Cost breakdown updated'
        });
      }

      // Batch log all changes
      for (const entry of auditEntries) {
        await supabase.rpc('log_variation_change', entry);
      }

      if (auditEntries.length > 0) {
        console.log(`Logged ${auditEntries.length} field changes for variation ${variationId}`);
      }

    } catch (error) {
      console.error('Failed to log field changes:', error);
      toast({
        title: "Audit Logging Warning",
        description: "Changes were saved but audit logging failed",
        variant: "destructive"
      });
    } finally {
      setIsLogging(false);
    }
  };

  const logStatusChange = async (
    variationId: string,
    fromStatus: string,
    toStatus: string,
    comments?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('log_variation_change', {
        p_variation_id: variationId,
        p_user_id: user.id,
        p_action_type: toStatus === 'pending_approval' ? 'submit' : 
                       toStatus === 'approved' ? 'approve' :
                       toStatus === 'rejected' ? 'reject' :
                       toStatus === 'draft' ? 'unlock' : 'status_change',
        p_status_from: fromStatus,
        p_status_to: toStatus,
        p_comments: comments || `Status changed from ${fromStatus} to ${toStatus}`
      });

    } catch (error) {
      console.error('Failed to log status change:', error);
    }
  };

  return {
    logFieldChanges,
    logStatusChange,
    isLogging
  };
};