
import { supabase } from '@/integrations/supabase/client';
import { Variation, VariationError } from '@/types/variations';
import { VariationAuditService } from './VariationAuditService';

export class VariationEmailService {
  constructor(private auditService: VariationAuditService) {}

  async sendVariationEmail(variation: Variation, userId: string): Promise<boolean> {
    if (!variation.client_email) {
      throw new VariationError(
        'No client email found for this variation',
        'MISSING_CLIENT_EMAIL'
      );
    }

    try {
      const { error } = await supabase.functions.invoke('send-variation-email', {
        body: {
          variation: variation,
          recipientEmail: variation.client_email
        }
      });

      if (error) {
        throw new VariationError(
          'Failed to send variation email',
          'EMAIL_SEND_ERROR',
          error
        );
      }

      // Log email action
      await this.auditService.logAuditTrail(
        variation.id,
        userId,
        'email_sent',
        `Variation email sent to ${variation.client_email}`
      );

      return true;
    } catch (error) {
      if (error instanceof VariationError) {
        throw error;
      }
      throw new VariationError(
        'Unexpected error sending email',
        'UNKNOWN_ERROR',
        error
      );
    }
  }
}
