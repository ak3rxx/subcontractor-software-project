
import { Variation, VariationFormData } from '@/types/variations';
import { useVariationData } from './useVariationData';
import { useVariationCRUD } from './useVariationCRUD';
import { useVariationEmail } from './useVariationEmail';
import { useVariationFilters } from './useVariationFilters';
import { useVariationSummary } from './useVariationSummary';

export const useVariationsRefactored = (projectId: string) => {
  // Data management
  const {
    variations,
    setVariations,
    loading,
    error,
    refetch,
    clearError
  } = useVariationData(projectId);

  // CRUD operations
  const {
    createVariation,
    updateVariation
  } = useVariationCRUD(variations, setVariations, refetch);

  // Email functionality
  const {
    sendVariationEmail
  } = useVariationEmail(variations, setVariations);

  // Filtering
  const {
    filters,
    filteredVariations,
    updateFilter,
    resetFilters,
    setFilters
  } = useVariationFilters(variations);

  // Summary calculations
  const summary = useVariationSummary(variations);

  return {
    // Data
    variations,
    filteredVariations,
    loading,
    error,
    summary,

    // Actions
    createVariation,
    updateVariation,
    sendVariationEmail,
    refetch,
    clearError,

    // Filters
    filters,
    updateFilter,
    resetFilters,
    setFilters
  };
};
