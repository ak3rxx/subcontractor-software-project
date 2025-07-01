
import { supabase } from '@/integrations/supabase/client';

export class VariationAuditService {
  async logAuditTrail(
    variationId: string,
    userId: string,
    actionType: string,
    comments?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await supabase.rpc('log_variation_change', {
        p_variation_id: variationId,
        p_user_id: userId,
        p_action_type: actionType,
        p_comments: comments,
        p_metadata: metadata || {}
      });
    } catch (error) {
      console.error('Failed to log audit trail:', error);
      // Don't throw error for audit logging failures
    }
  }
}
