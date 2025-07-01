
import { supabase } from '@/integrations/supabase/client';
import { Variation, VariationError } from '@/types/variations';
import { transformDatabaseToVariation } from '@/utils/variationTransforms';
import { VariationCacheService } from './VariationCacheService';

export class VariationDataService {
  constructor(private cacheService: VariationCacheService) {}

  async fetchVariations(projectId: string, forceRefresh = false): Promise<Variation[]> {
    if (!projectId) {
      throw new VariationError('Project ID is required', 'MISSING_PROJECT_ID');
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = this.cacheService.get(projectId);
      if (cached) {
        return cached;
      }
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
      this.cacheService.set(projectId, variations);
      
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
}
