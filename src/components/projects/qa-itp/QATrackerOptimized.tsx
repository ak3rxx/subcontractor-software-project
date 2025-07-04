import React, { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Filter, 
  Search, 
  X, 
  Edit, 
  Calendar,
  MapPin,
  User,
  Settings,
  RefreshCw,
  Archive,
  BarChart3
} from 'lucide-react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import QAITPForm from './QAITPForm';
import QAInspectionModal from './QAInspectionModal';
import QABulkExport from './QABulkExport';

interface QATrackerProps {
  projectId: string;
  onNewInspection?: () => void;
}

// Memoized components for performance
const StatsCard = memo(({ title, value, icon, color }: { 
  title: string; 
  value: number; 
  icon: string; 
  color: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${color}`}>{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className="text-lg">{icon}</div>
      </div>
    </CardContent>
  </Card>
));

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
        <Button variant="ghost" size="sm" onClick={() => onView(inspection)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(inspection)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(inspection.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </td>
  </tr>
));

const QATrackerOptimized: React.FC<QATrackerProps> = ({ 
  projectId,
  onNewInspection 
}) => {
  const { inspections, loading, deleteInspection, refetch } = useQAInspectionsSimple(projectId);
  const { user } = useAuth();
  const { toast } = useToast();

  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBulkExport, setShowBulkExport] = useState(false);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState('all');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('all');
  const [inspectorFilter, setInspectorFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Memoized computations for performance
  const statusCounts = useMemo(() => {
    return inspections.reduce((acc, inspection) => {
      acc[inspection.overall_status] = (acc[inspection.overall_status] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [inspections]);

  const uniqueInspectors = useMemo(() => {
    const inspectors = new Set(inspections.map(i => i.inspector_name).filter(Boolean));
    return Array.from(inspectors).sort();
  }, [inspections]);

  // Optimized filter function with debouncing effect
  const filteredInspections = useMemo(() => {
    if (!inspections.length) return [];
    
    return inspections.filter(inspection => {
      // Text search with early return
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const searchMatch = [
          inspection.task_area,
          inspection.inspection_number,
          inspection.inspector_name,
          inspection.location_reference,
          inspection.project_name
        ].some(field => field?.toLowerCase().includes(searchLower));
        
        if (!searchMatch) return false;
      }

      // Quick status filters
      if (statusFilter !== 'all' && inspection.overall_status !== statusFilter) return false;
      if (inspectionTypeFilter !== 'all' && inspection.inspection_type !== inspectionTypeFilter) return false;
      if (templateTypeFilter !== 'all' && inspection.template_type !== templateTypeFilter) return false;
      if (inspectorFilter !== 'all' && inspection.inspector_name !== inspectorFilter) return false;

      // Date range filter
      if (dateRangeFilter !== 'all' && inspection.inspection_date) {
        const inspectionDate = new Date(inspection.inspection_date);
        const now = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            if (inspectionDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (inspectionDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            if (inspectionDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [inspections, searchTerm, statusFilter, inspectionTypeFilter, templateTypeFilter, inspectorFilter, dateRangeFilter]);

  // Optimized event handlers
  const handleSelectItem = useCallback((inspectionId: string, checked: boolean) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(inspectionId);
      } else {
        newSelection.delete(inspectionId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedItems(checked ? new Set(filteredInspections.map(i => i.id)) : new Set());
  }, [filteredInspections]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} inspection(s)?`)) {
      let successCount = 0;
      for (const id of selectedItems) {
        const success = await deleteInspection(id);
        if (success) successCount++;
      }
      
      toast({
        title: successCount === selectedItems.size ? "Success" : "Partial Success",
        description: `${successCount}/${selectedItems.size} inspections deleted`,
        variant: successCount === selectedItems.size ? "default" : "destructive"
      });
      
      setSelectedItems(new Set());
    }
  }, [selectedItems, deleteInspection, toast]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setInspectionTypeFilter('all');
    setTemplateTypeFilter('all');
    setInspectorFilter('all');
    setDateRangeFilter('all');
  }, []);

  // Stable utility functions
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'pending-reinspection': return '🔄';
      case 'incomplete-in-progress': return '⏳';
      default: return '❓';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'pending-reinspection': return 'bg-orange-100 text-orange-800';
      case 'incomplete-in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handleViewInspection = useCallback((inspection: any) => {
    setSelectedInspection(inspection);
  }, []);

  const handleEditInspection = useCallback((inspection: any) => {
    setEditingInspection(inspection);
    setShowCreateForm(true);
  }, []);

  const handleDeleteInspection = useCallback(async (inspectionId: string) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      const success = await deleteInspection(inspectionId);
      if (success) {
        toast({
          title: "Success",
          description: "Inspection deleted successfully"
        });
      }
    }
  }, [deleteInspection, toast]);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || inspectionTypeFilter !== 'all' || 
    templateTypeFilter !== 'all' || inspectorFilter !== 'all' || dateRangeFilter !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading QA inspections...</span>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <QAITPForm
        projectId={projectId}
        editingInspection={editingInspection}
        onClose={() => {
          setShowCreateForm(false);
          setEditingInspection(null);
          onNewInspection?.();
        }}
      />
    );
  }

  if (showBulkExport) {
    return (
      <QABulkExport
        selectedInspectionIds={Array.from(selectedItems)}
        onClose={() => setShowBulkExport(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">QA/ITP Tracker</h2>
          <p className="text-muted-foreground">
            Manage quality assurance inspections and test plans
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)} data-tour="new-inspection-btn">
            <Plus className="h-4 w-4 mr-2" />
            New Inspection
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard title="Total" value={statusCounts.total || 0} icon="📊" color="text-muted-foreground" />
        <StatsCard title="Passed" value={statusCounts.pass || 0} icon="✅" color="text-green-600" />
        <StatsCard title="Failed" value={statusCounts.fail || 0} icon="❌" color="text-red-600" />
        <StatsCard title="Pending" value={statusCounts['pending-reinspection'] || 0} icon="🔄" color="text-orange-600" />
        <StatsCard title="In Progress" value={statusCounts['incomplete-in-progress'] || 0} icon="⏳" color="text-yellow-600" />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inspections..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && <Badge variant="secondary" className="ml-1">Active</Badge>}
              </Button>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Quick Status Filters */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={statusFilter === 'fail' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'fail' ? 'all' : 'fail')}
              >
                ❌ Failed ({statusCounts.fail || 0})
              </Button>
              <Button 
                variant={statusFilter === 'pending-reinspection' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'pending-reinspection' ? 'all' : 'pending-reinspection')}
              >
                🔄 Pending ({statusCounts['pending-reinspection'] || 0})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inspections ({filteredInspections.length})</CardTitle>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedItems.size} selected
                </span>
                <Button variant="outline" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
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
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Inspection
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 w-12">
                      <Checkbox
                        checked={selectedItems.size === filteredInspections.length && filteredInspections.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left py-3 px-4">Number</th>
                    <th className="text-left py-3 px-4">Task Area</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Inspector</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Location</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.map((inspection) => (
                    <InspectionRow
                      key={inspection.id}
                      inspection={inspection}
                      isSelected={selectedItems.has(inspection.id)}
                      onSelect={handleSelectItem}
                      onView={handleViewInspection}
                      onEdit={handleEditInspection}
                      onDelete={handleDeleteInspection}
                      getStatusColor={getStatusColor}
                      getStatusIcon={getStatusIcon}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspection Modal */}
      {selectedInspection && (
        <QAInspectionModal
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          onUpdate={(updated) => {
            setSelectedInspection(updated);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default memo(QATrackerOptimized);