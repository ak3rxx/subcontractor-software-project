
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useEmailLogging = () => {
  const { user } = useAuth();

  // Simplified function for email logging only (database trigger handles everything else)
  const logEmailSent = useCallback(async (variationId: string, comments?: string) => {
    if (!variationId || !user) {
      console.warn('Cannot log email: missing variationId or user');
      return false;
    }

    try {
      console.log('Logging email sent for variation:', variationId);

      const { data, error } = await supabase
        .rpc('log_variation_change', {
          p_variation_id: variationId,
          p_user_id: user.id,
          p_action_type: 'email_sent',
          p_comments: comments || 'Variation email sent'
        });

      if (error) {
        console.error('Error logging email:', error);
        return false;
      }

      console.log('Email logged successfully:', data);
      return true;
    } catch (error) {
      console.error('Error logging email:', error);
      return false;
    }
  }, [user]);

  return { logEmailSent };
};
