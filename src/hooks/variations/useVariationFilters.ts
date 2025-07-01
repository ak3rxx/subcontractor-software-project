
import { useState, useMemo, useCallback } from 'react';
import { Variation, VariationFilters } from '@/types/variations';

export const useVariationFilters = (variations: Variation[]) => {
  const [filters, setFilters] = useState<VariationFilters>({
    searchTerm: '',
    statusFilter: 'all',
    priorityFilter: 'all',
    categoryFilter: 'all',
    tradeFilter: 'all'
  });

  const filteredVariations = useMemo(() => {
    return variations.filter(variation => {
      const matchesSearch = variation.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           variation.variation_number.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           (variation.description && variation.description.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const matchesStatus = filters.statusFilter === 'all' || variation.status === filters.statusFilter;
      const matchesPriority = filters.priorityFilter === 'all' || variation.priority === filters.priorityFilter;
      const matchesCategory = !filters.categoryFilter || filters.categoryFilter === 'all' || variation.category === filters.categoryFilter;
      const matchesTrade = !filters.tradeFilter || filters.tradeFilter === 'all' || variation.trade === filters.tradeFilter;

      let matchesDateRange = true;
      if (filters.dateRange) {
        const variationDate = new Date(variation.created_at);
        matchesDateRange = variationDate >= filters.dateRange.start && variationDate <= filters.dateRange.end;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTrade && matchesDateRange;
    });
  }, [variations, filters]);

  const updateFilter = useCallback((key: keyof VariationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statusFilter: 'all',
      priorityFilter: 'all',
      categoryFilter: 'all',
      tradeFilter: 'all'
    });
  }, []);

  return {
    filters,
    filteredVariations,
    updateFilter,
    resetFilters,
    setFilters
  };
};
