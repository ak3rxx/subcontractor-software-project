
import React from 'react';
import VariationFilters from '../VariationFilters';

interface VariationManagerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
}

const VariationManagerFilters: React.FC<VariationManagerFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter
}) => {
  return (
    <VariationFilters
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      priorityFilter={priorityFilter}
      setPriorityFilter={setPriorityFilter}
    />
  );
};

export default VariationManagerFilters;
