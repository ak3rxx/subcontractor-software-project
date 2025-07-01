
import { supabase } from '@/integrations/supabase/client';
import { Variation, VariationFormData, VariationError } from '@/types/variations';
import { transformDatabaseToVariation, transformFormToDatabase } from '@/utils/variationTransforms';

export class VariationService {
  private static instance: VariationService;
  private cache = new Map<string, { data: Variation[]; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): VariationService {
    if (!VariationService.instance) {
      VariationService.instance = new VariationService();
    }
    return VariationService.instance;
  }

  async fetchVariations(projectId: string, forceRefresh = false): Promise<Variation[]> {
    if (!projectId) {
      throw new VariationError('Project ID is required', 'MISSING_PROJECT_ID');
    }

    // Check cache first
    const cacheKey = `variations_${projectId}`;
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('variations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new VariationError(
          'Failed to fetch variations',
          'FETCH_ERROR',
          error
        );
      }

      const variations = (data || []).map(transformDatabaseToVariation);
      
      // Update cache
      this.cache.set(cacheKey, { data: variations, timestamp: now });
      
      return variations;
    } catch (error) {
      if (error instanceof VariationError) {
        throw error;
      }
      throw new VariationError(
        'Unexpected error fetching variations',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  async createVariation(
    projectId: string, 
    formData: VariationFormData, 
    userId: string
  ): Promise<Variation> {
    if (!userId || !projectId) {
      throw new VariationError(
        'User ID and Project ID are required',
        'MISSING_REQUIRED_FIELDS'
      );
    }

    try {
      // Generate variation number
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_variation_number', { project_uuid: projectId });

      if (numberError) {
        throw new VariationError(
          'Failed to generate variation number',
          'NUMBER_GENERATION_ERROR',
          numberError
        );
      }

      const insertData = {
        ...transformFormToDatabase(formData, projectId, userId),
        variation_number: numberData
      };

      const { data, error } = await supabase
        .from('variations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new VariationError(
          'Failed to create variation',
          'CREATE_ERROR',
          error
        );
      }

      // Log creation in audit trail
      await this.logAuditTrail(data.id, userId, 'create', `Variation ${data.variation_number} created`);

      // Clear cache
      this.clearCache(projectId);

      return transformDatabaseToVariation(data);
    } catch (error) {
      if (error instanceof VariationError) {
        throw error;
      }
      throw new VariationError(
        'Unexpected error creating variation',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

  async updateVariation(
    id: string, 
    updates: Partial<Variation>, 
    userId: string
  ): Promise<Variation> {
    if (!userId) {
      throw new VariationError('User ID is required', 'MISSING_USER_ID');
    }

    try {
      const dbUpdates: any = { ...updates };
      dbUpdates.updated_at = new Date().toISOString();
      dbUpdates.updated_by = userId;

      const { data, error } = await supabase
        .from('variations')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new VariationError(
          'Failed to update variation',
          'UPDATE_ERROR',
          error
        );
      }

      if (!data) {
        throw new VariationError(
          'No data returned from update',
          'NO_DATA_RETURNED'
        );
      }

      // Clear relevant cache
      this.clearCache(data.project_id);

      return transformDatabaseToVariation(data);
    } catch (error) {
      if (error instanceof VariationError) {
        throw error;
      }
      throw new VariationError(
        'Unexpected error updating variation',
        'UNKNOWN_ERROR',
        error
      );
    }
  }

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

      // Update variation with email sent status
      await this.updateVariation(variation.id, {
        email_sent: true,
        email_sent_date: new Date().toISOString(),
        email_sent_by: userId
      }, userId);

      // Log email action
      await this.logAuditTrail(
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

  private async logAuditTrail(
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

  private clearCache(projectId?: string): void {
    if (projectId) {
      this.cache.delete(`variations_${projectId}`);
    } else {
      this.cache.clear();
    }
  }

  clearAllCache(): void {
    this.cache.clear();
  }
}

export const variationService = VariationService.getInstance();
