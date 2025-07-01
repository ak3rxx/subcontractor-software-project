
import { useMemo } from 'react';
import { Variation } from '@/types/variations';

export const useVariationSummary = (variations: Variation[]) => {
  const summary = useMemo(() => {
    const initial = {
      total: 0,
      draft: 0,
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      totalCostImpact: 0,
      averageTimeImpact: 0
    };

    const result = variations.reduce((acc, variation) => {
      acc.total++;
      acc[variation.status as keyof typeof acc]++;
      acc.totalCostImpact += variation.cost_impact || 0;
      acc.averageTimeImpact += variation.time_impact || 0;
      return acc;
    }, initial);

    // Calculate average time impact
    if (result.total > 0) {
      result.averageTimeImpact = Math.round(result.averageTimeImpact / result.total);
    }

    return result;
  }, [variations]);

  return summary;
};
