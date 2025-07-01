
import React, { useMemo } from 'react';
import { Variation, VariationFilters } from '@/types/variations';
import { Card, CardContent } from '@/components/ui/card';
import VariationListItem from './VariationListItem';
import VariationListEmpty from './VariationListEmpty';
import VariationListLoading from './VariationListLoading';

interface VariationListProps {
  variations: Variation[];
  loading?: boolean;
  filters: VariationFilters;
  onItemClick?: (variation: Variation) => void;
  onEdit?: (variation: Variation) => void;
  onSendEmail?: (variationId: string) => void;
  onCreateFirst?: () => void;
  canEdit?: boolean;
  canSendEmails?: boolean;
}

const VariationList: React.FC<VariationListProps> = ({
  variations,
  loading = false,
  filters,
  onItemClick,
  onEdit,
  onSendEmail,
  onCreateFirst,
  canEdit = false,
  canSendEmails = false
}) => {
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

  if (loading) {
    return <VariationListLoading />;
  }

  if (variations.length === 0) {
    return <VariationListEmpty onCreateFirst={onCreateFirst} />;
  }

  if (filteredVariations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No variations match your current filters.</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredVariations.map((variation) => (
        <VariationListItem
          key={variation.id}
          variation={variation}
          onClick={() => onItemClick?.(variation)}
          onEdit={() => onEdit?.(variation)}
          onSendEmail={() => onSendEmail?.(variation.id)}
          canEdit={canEdit}
          canSendEmails={canSendEmails}
        />
      ))}
    </div>
  );
};

export default VariationList;
