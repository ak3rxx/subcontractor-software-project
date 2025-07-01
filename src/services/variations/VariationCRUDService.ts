
import { supabase } from '@/integrations/supabase/client';
import { Variation, VariationFormData, VariationError } from '@/types/variations';
import { transformDatabaseToVariation, transformFormToDatabase } from '@/utils/variationTransforms';
import { VariationCacheService } from './VariationCacheService';
import { VariationAuditService } from './VariationAuditService';

export class VariationCRUDService {
  constructor(
    private cacheService: VariationCacheService,
    private auditService: VariationAuditService
  ) {}

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
      await this.auditService.logAuditTrail(
        data.id, 
        userId, 
        'create', 
        `Variation ${data.variation_number} created`
      );

      // Clear cache
      this.cacheService.clear(projectId);

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
      this.cacheService.clear(data.project_id);

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
}
