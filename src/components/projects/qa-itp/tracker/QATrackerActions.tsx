import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';

interface QATrackerActionsProps {
  selectedItems: Set<string>;
  onExportSelected: () => void;
  onBulkDelete: () => void;
}

const QATrackerActions: React.FC<QATrackerActionsProps> = ({
  selectedItems,
  onExportSelected,
  onBulkDelete
}) => {
  if (selectedItems.size === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        {selectedItems.size} selected
      </span>
      <Button variant="outline" size="sm" onClick={onExportSelected}>
        <Download className="h-4 w-4 mr-2" />
        Export Selected
      </Button>
      <Button variant="outline" size="sm" onClick={onBulkDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Selected
      </Button>
    </div>
  );
};

export default QATrackerActions;