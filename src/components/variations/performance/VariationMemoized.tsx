
import React, { memo } from 'react';
import { Variation } from '@/types/variations';
import { formatCurrency } from '@/utils/variationTransforms';

interface VariationMemoizedProps {
  variation: Variation;
  onClick?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

const VariationMemoized: React.FC<VariationMemoizedProps> = memo(({
  variation,
  onClick,
  onEdit,
  canEdit = false
}) => {
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{variation.title}</h4>
          <p className="text-sm text-gray-600">{variation.variation_number}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">{formatCurrency(variation.cost_impact)}</p>
          <p className="text-xs text-gray-500">{variation.status}</p>
        </div>
      </div>
      {canEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Edit
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.variation.id === nextProps.variation.id &&
    prevProps.variation.updated_at === nextProps.variation.updated_at &&
    prevProps.canEdit === nextProps.canEdit
  );
});

VariationMemoized.displayName = 'VariationMemoized';

export default VariationMemoized;
