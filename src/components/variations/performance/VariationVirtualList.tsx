
import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Variation } from '@/types/variations';
import VariationMemoized from './VariationMemoized';

interface VariationVirtualListProps {
  variations: Variation[];
  height?: number;
  itemHeight?: number;
  onItemClick?: (variation: Variation) => void;
  onItemEdit?: (variation: Variation) => void;
  canEdit?: boolean;
}

const VariationVirtualList: React.FC<VariationVirtualListProps> = memo(({
  variations,
  height = 600,
  itemHeight = 120,
  onItemClick,
  onItemEdit,
  canEdit = false
}) => {
  const itemData = useMemo(() => ({
    variations,
    onItemClick,
    onItemEdit,
    canEdit
  }), [variations, onItemClick, onItemEdit, canEdit]);

  const Row = memo(({ index, style, data }: any) => {
    const { variations, onItemClick, onItemEdit, canEdit } = data;
    const variation = variations[index];

    return (
      <div style={style}>
        <div className="p-2">
          <VariationMemoized
            variation={variation}
            onClick={() => onItemClick?.(variation)}
            onEdit={() => onItemEdit?.(variation)}
            canEdit={canEdit}
          />
        </div>
      </div>
    );
  });

  Row.displayName = 'VirtualListRow';

  if (variations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No variations found
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={variations.length}
      itemSize={itemHeight}
      itemData={itemData}
    >
      {Row}
    </List>
  );
});

VariationVirtualList.displayName = 'VariationVirtualList';

export default VariationVirtualList;
