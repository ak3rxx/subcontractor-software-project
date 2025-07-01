
import React from 'react';
import { Button } from '@/components/ui/button';

interface VariationTableEmptyProps {
  canCreateVariations: boolean;
  onCreateFirst: () => void;
}

const VariationTableEmpty: React.FC<VariationTableEmptyProps> = ({
  canCreateVariations,
  onCreateFirst
}) => {
  return (
    <div className="text-center py-8">
      <p className="text-gray-500 mb-4">No variations found</p>
      {canCreateVariations && (
        <Button onClick={onCreateFirst}>
          Create First Variation
        </Button>
      )}
    </div>
  );
};

export default VariationTableEmpty;
