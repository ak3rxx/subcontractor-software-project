import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  MapPin,
  User,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import QATrackerActions from './QATrackerActions';

const InspectionRow = memo(({ 
  inspection, 
  isSelected, 
  onSelect, 
  onView,
  onEdit,
  onDelete,
  getStatusColor,
  getStatusIcon
}: any) => (
  <tr className="border-b hover:bg-muted/50 transition-colors">
    <td className="py-3 px-4">
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onSelect(inspection.id, checked)}
      />
    </td>
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{inspection.inspection_number}</span>
      </div>
    </td>
    <td className="py-3 px-4">{inspection.task_area}</td>
    <td className="py-3 px-4">
      <Badge className={getStatusColor(inspection.overall_status)}>
        {getStatusIcon(inspection.overall_status)} {inspection.overall_status?.replace('-', ' ')}
      </Badge>
    </td>
    <td className="py-3 px-4">
      <div className="flex items-center gap-1">
        <User className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{inspection.inspector_name}</span>
      </div>
    </td>
    <td className="py-3 px-4">
      <div className="flex items-center gap-1">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">
          {inspection.inspection_date ? format(new Date(inspection.inspection_date), 'dd/MM/yyyy') : 'N/A'}
        </span>
      </div>
    </td>
    <td className="py-3 px-4">
      <div className="flex items-center gap-1">
        <MapPin className="h-3 w-3 text-muted-foreground" />
        <span className="text-sm">{inspection.location_reference}</span>
      </div>
    </td>
    <td className="py-3 px-4">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('QA Action Debug: View button clicked for inspection:', inspection.id);
                onView(inspection);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Details</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('QA Action Debug: Edit button clicked for inspection:', inspection.id);
                onEdit(inspection);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit Inspection</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('QA Action Debug: Delete button clicked for inspection:', inspection.id);
                onDelete(inspection.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete Inspection</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </td>
  </tr>
));

interface QATrackerTableProps {
  filteredInspections: any[];
  selectedItems: Set<string>;
  onSelectItem: (inspectionId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onViewInspection: (inspection: any) => void;
  onEditInspection: (inspection: any) => void;
  onDeleteInspection: (inspectionId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => string;
  hasActiveFilters: boolean;
  onNewInspection: () => void;
  onExportSelected: () => void;
  onBulkDelete: () => void;
}

const QATrackerTable: React.FC<QATrackerTableProps> = ({
  filteredInspections,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onViewInspection,
  onEditInspection,
  onDeleteInspection,
  getStatusColor,
  getStatusIcon,
  hasActiveFilters,
  onNewInspection,
  onExportSelected,
  onBulkDelete
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Inspections ({filteredInspections.length})</CardTitle>
          <QATrackerActions
            selectedItems={selectedItems}
            onExportSelected={onExportSelected}
            onBulkDelete={onBulkDelete}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredInspections.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No inspections found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first QA inspection to get started'}
            </p>
            {!hasActiveFilters && (
              <Button onClick={onNewInspection}>
                <Plus className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TooltipProvider>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 w-12">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Checkbox
                              checked={selectedItems.size === filteredInspections.length && filteredInspections.length > 0}
                              onCheckedChange={onSelectAll}
                            />
                            <span className="text-xs text-muted-foreground">Select All</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select/deselect all visible inspection records</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>Inspection Number</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Unique identifier for each QA inspection</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>Task & Area</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Description of the work area being inspected</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span>Status</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Current status: Pass, Fail, Pending, or In Progress</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Inspector</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Person who conducted the inspection</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Date</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>When the inspection was performed</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>Location</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Specific location within the project site</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                    <th className="text-left py-3 px-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span>Actions</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View, edit, or delete inspection records</p>
                        </TooltipContent>
                      </Tooltip>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.map((inspection) => (
                    <InspectionRow
                      key={inspection.id}
                      inspection={inspection}
                      isSelected={selectedItems.has(inspection.id)}
                      onSelect={onSelectItem}
                      onView={onViewInspection}
                      onEdit={onEditInspection}
                      onDelete={onDeleteInspection}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </tbody>
              </table>
            </TooltipProvider>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QATrackerTable;