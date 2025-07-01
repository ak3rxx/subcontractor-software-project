
import { useCallback, useMemo } from 'react';
import { Variation } from '@/types/variations';

export const useVariationOptimizations = (variations: Variation[]) => {
  // Memoized calculations
  const variationMap = useMemo(() => {
    return variations.reduce((map, variation) => {
      map[variation.id] = variation;
      return map;
    }, {} as Record<string, Variation>);
  }, [variations]);

  const statusCounts = useMemo(() => {
    return variations.reduce((counts, variation) => {
      counts[variation.status] = (counts[variation.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [variations]);

  const priorityCounts = useMemo(() => {
    return variations.reduce((counts, variation) => {
      counts[variation.priority] = (counts[variation.priority] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }, [variations]);

  // Optimized getters
  const getVariationById = useCallback((id: string) => {
    return variationMap[id];
  }, [variationMap]);

  const getVariationsByStatus = useCallback((status: string) => {
    return variations.filter(v => v.status === status);
  }, [variations]);

  const getVariationsByPriority = useCallback((priority: string) => {
    return variations.filter(v => v.priority === priority);
  }, [variations]);

  return {
    variationMap,
    statusCounts,
    priorityCounts,
    getVariationById,
    getVariationsByStatus,
    getVariationsByPriority
  };
};
