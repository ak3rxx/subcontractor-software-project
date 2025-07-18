import React, { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { QAInspection } from '@/hooks/useQAInspectionsSimple';
import { FixedSizeList as List } from 'react-window';

interface QATrackerTableOptimizedProps {
  inspections: QAInspection[];
  selectedItems: Set<string>;
  onSelectItem: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onView: (inspection: any) => void;
  onEdit: (inspection: any) => void;
  onDelete: (id: string) => void;
  getStatusIcon: (status: string) => string;
  getStatusColor: (status: string) => string;
}

// PERFORMANCE OPTIMIZATION: Memoized row component
const InspectionRow = memo<{
  index: number;
  style: any;
  data: {
    inspections: QAInspection[];
    selectedItems: Set<string>;
    onSelectItem: (id: string, checked: boolean) => void;
    onView: (inspection: any) => void;
    onEdit: (inspection: any) => void;
    onDelete: (id: string) => void;
    getStatusIcon: (status: string) => string;
    getStatusColor: (status: string) => string;
  };
}>(({ index, style, data }) => {
  const { inspections, selectedItems, onSelectItem, onView, onEdit, onDelete, getStatusIcon, getStatusColor } = data;
  const inspection = inspections[index];

  return (
    <div style={style} className="flex items-center border-b border-border/40 px-4 py-2 hover:bg-muted/50">
      <div className="flex items-center space-x-3 w-full">
        <Checkbox
          checked={selectedItems.has(inspection.id)}
          onCheckedChange={(checked) => onSelectItem(inspection.id, checked as boolean)}
        />
        
        <div className="flex-1 grid grid-cols-8 gap-4 items-center min-w-0">
          <div className="truncate font-medium">{inspection.inspection_number}</div>
          <div className="truncate">{inspection.task_area}</div>
          <div className="truncate text-sm text-muted-foreground">{inspection.location_reference}</div>
          <div className="truncate">{inspection.inspector_name}</div>
          <div className="text-sm">{new Date(inspection.inspection_date).toLocaleDateString()}</div>
          <div className="truncate capitalize">{inspection.inspection_type?.replace('-', ' ')}</div>
          <div className="truncate capitalize">{inspection.trade?.replace('-', ' ')}</div>
          
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(inspection.overall_status)} border-0`}>
              {getStatusIcon(inspection.overall_status)} {inspection.overall_status?.replace('-', ' ')}
            </Badge>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(inspection)}
                className="h-7 w-7 p-0"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(inspection)}
                className="h-7 w-7 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(inspection.id)}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const QATrackerTableOptimized: React.FC<QATrackerTableOptimizedProps> = ({
  inspections,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  getStatusIcon,
  getStatusColor
}) => {
  // PERFORMANCE OPTIMIZATION: Memoize row data to prevent unnecessary re-renders
  const rowData = useMemo(() => ({
    inspections,
    selectedItems,
    onSelectItem,
    onView,
    onEdit,
    onDelete,
    getStatusIcon,
    getStatusColor
  }), [inspections, selectedItems, onSelectItem, onView, onEdit, onDelete, getStatusIcon, getStatusColor]);

  const allSelected = inspections.length > 0 && inspections.every(i => selectedItems.has(i.id));
  const someSelected = inspections.some(i => selectedItems.has(i.id)) && !allSelected;

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground mb-2">No inspections found</div>
        <div className="text-sm text-muted-foreground">Try adjusting your filters or create a new inspection</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* PERFORMANCE OPTIMIZATION: Single TooltipProvider at top level */}
      <TooltipProvider>
        {/* Header */}
        <div className="flex items-center space-x-3 border-b border-border/40 px-4 py-3 bg-muted/30">
          <Checkbox
            checked={allSelected}
            ref={(el: HTMLButtonElement | null) => {
              if (el) {
                (el as any).indeterminate = someSelected;
              }
            }}
            onCheckedChange={(checked) => onSelectAll(checked as boolean)}
          />
          
          <div className="flex-1 grid grid-cols-8 gap-4 text-sm font-medium text-muted-foreground">
            <div>Inspection #</div>
            <div>Task Area</div>
            <div>Location</div>
            <div>Inspector</div>
            <div>Date</div>
            <div>Type</div>
            <div>Trade</div>
            <div>Status & Actions</div>
          </div>
        </div>

        {/* PERFORMANCE OPTIMIZATION: Virtual scrolling for large lists */}
        {inspections.length > 20 ? (
          <List
            height={400}
            itemCount={inspections.length}
            itemSize={60}
            itemData={rowData}
            className="scrollbar-thin"
          >
            {InspectionRow}
          </List>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {inspections.map((inspection, index) => (
              <InspectionRow
                key={inspection.id}
                index={index}
                style={{}}
                data={rowData}
              />
            ))}
          </div>
        )}
      </TooltipProvider>
    </div>
  );
};

export default QATrackerTableOptimized;