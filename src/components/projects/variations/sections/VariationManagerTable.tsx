
import React from 'react';
import VariationTable from '../VariationTable';
import { Variation } from '@/types/variations';

interface VariationManagerTableProps {
  variations: Variation[];
  canEditVariations: boolean;
  canSendEmails: boolean;
  canCreateVariations: boolean;
  onViewDetails: (variation: Variation) => void;
  onEdit: (variation: Variation) => void;
  onSendEmail: (variationId: string) => void;
  onCreateFirst: () => void;
}

const VariationManagerTable: React.FC<VariationManagerTableProps> = (props) => {
  return <VariationTable {...props} />;
};

export default VariationManagerTable;
