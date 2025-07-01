
import React from 'react';
import { VariationFilters } from '@/types/variations';
import VariationFilters from '../VariationFilters';

interface VariationManagerFiltersProps {
  filters?: VariationFilters;
  onFilterChange?: (key: keyof VariationFilters, value: any) => void;
  onFiltersChange?: React.Dispatch<React.SetStateAction<VariationFilters>>;
  // Legacy props for backward compatibility
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  priorityFilter?: string;
  setPriorityFilter?: (priority: string) => void;
}

const VariationManagerFilters: React.FC<VariationManagerFiltersProps> = ({
  filters,
  onFilterChange,
  onFiltersChange,
  // Legacy props
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter
}) => {
  // Use new props if available, otherwise fall back to legacy props
  const currentSearchTerm = filters?.searchTerm || searchTerm || '';
  const currentStatusFilter = filters?.statusFilter || statusFilter || 'all';
  const currentPriorityFilter = filters?.priorityFilter || priorityFilter || 'all';

  const handleSearchTermChange = (term: string) => {
    if (onFilterChange) {
      onFilterChange('searchTerm', term);
    } else if (setSearchTerm) {
      setSearchTerm(term);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    if (onFilterChange) {
      onFilterChange('statusFilter', status);
    } else if (setStatusFilter) {
      setStatusFilter(status);
    }
  };

  const handlePriorityFilterChange = (priority: string) => {
    if (onFilterChange) {
      onFilterChange('priorityFilter', priority);
    } else if (setPriorityFilter) {
      setPriorityFilter(priority);
    }
  };

  return (
    <VariationFilters
      searchTerm={currentSearchTerm}
      setSearchTerm={handleSearchTermChange}
      statusFilter={currentStatusFilter}
      setStatusFilter={handleStatusFilterChange}
      priorityFilter={currentPriorityFilter}
      setPriorityFilter={handlePriorityFilterChange}
    />
  );
};

export default VariationManagerFilters;
