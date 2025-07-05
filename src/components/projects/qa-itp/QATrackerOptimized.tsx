import React, { useState, useMemo, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Archive,
  BarChart3,
  Wifi
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onView(inspection)}>
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onEdit(inspection)}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Inspection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onDelete(inspection.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Inspection</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [tradeFilter, setTradeFilter] = useState('all');
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

  const uniqueBuildings = useMemo(() => {
    const buildings = new Set(
      inspections.map(i => {
        const match = i.location_reference?.match(/building\s*(\d+|[a-z]+)/i);
        return match ? match[0] : null;
      }).filter(Boolean)
    );
    return Array.from(buildings).sort();
  }, [inspections]);

  const uniqueLevels = useMemo(() => {
    const levels = new Set(
      inspections.map(i => {
        const match = i.location_reference?.match(/level\s*(\d+|[a-z]+)/i);
        return match ? match[0] : null;
      }).filter(Boolean)
    );
    return Array.from(levels).sort();
  }, [inspections]);

  const uniqueTasks = useMemo(() => {
    const tasks = new Set(inspections.map(i => i.task_area).filter(Boolean));
    return Array.from(tasks).sort();
  }, [inspections]);

  const uniqueTrades = useMemo(() => {
    const trades = new Set(inspections.map(i => i.template_type).filter(Boolean));
    return Array.from(trades).sort();
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
      if (taskFilter !== 'all' && inspection.task_area !== taskFilter) return false;
      if (tradeFilter !== 'all' && inspection.template_type !== tradeFilter) return false;

      // Building filter
      if (buildingFilter !== 'all') {
        const buildingMatch = inspection.location_reference?.match(/building\s*(\d+|[a-z]+)/i);
        const extractedBuilding = buildingMatch ? buildingMatch[0] : null;
        if (extractedBuilding !== buildingFilter) return false;
      }

      // Level filter
      if (levelFilter !== 'all') {
        const levelMatch = inspection.location_reference?.match(/level\s*(\d+|[a-z]+)/i);
        const extractedLevel = levelMatch ? levelMatch[0] : null;
        if (extractedLevel !== levelFilter) return false;
      }

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
  }, [inspections, searchTerm, statusFilter, inspectionTypeFilter, templateTypeFilter, inspectorFilter, dateRangeFilter, buildingFilter, levelFilter, taskFilter, tradeFilter]);

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
    
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nYou are about to permanently delete ${selectedItems.size} inspection record(s). All associated data including:\n• Inspection details\n• Checklist items\n• Attachments\n• Audit history\n\nWill be permanently removed from the system.\n\nAre you sure you want to continue?`;
    
    if (window.confirm(confirmMessage)) {
      let successCount = 0;
      for (const id of selectedItems) {
        const success = await deleteInspection(id);
        if (success) successCount++;
      }
      
      toast({
        title: successCount === selectedItems.size ? "Records Deleted" : "Partial Deletion",
        description: `${successCount}/${selectedItems.size} inspection records permanently deleted`,
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
    setBuildingFilter('all');
    setLevelFilter('all');
    setTaskFilter('all');
    setTradeFilter('all');
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
    const confirmMessage = `⚠️ WARNING: This action cannot be undone!\n\nYou are about to permanently delete this inspection record. All associated data including:\n• Inspection details\n• Checklist items\n• Attachments\n• Audit history\n\nWill be permanently removed from the system.\n\nAre you sure you want to continue?`;
    
    if (window.confirm(confirmMessage)) {
      const success = await deleteInspection(inspectionId);
      if (success) {
        toast({
          title: "Record Deleted",
          description: "Inspection record permanently deleted",
          variant: "default"
        });
      }
    }
  }, [deleteInspection, toast]);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || inspectionTypeFilter !== 'all' || 
    templateTypeFilter !== 'all' || inspectorFilter !== 'all' || dateRangeFilter !== 'all' ||
    buildingFilter !== 'all' || levelFilter !== 'all' || taskFilter !== 'all' || tradeFilter !== 'all';

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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3 text-green-500" />
            <span>Live</span>
          </div>
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

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Advanced Filters</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Building</label>
                    <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Buildings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Buildings</SelectItem>
                        {uniqueBuildings.map((building) => (
                          <SelectItem key={building} value={building}>
                            {building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Level</label>
                    <Select value={levelFilter} onValueChange={setLevelFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {uniqueLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Task</label>
                    <Select value={taskFilter} onValueChange={setTaskFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Tasks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        {uniqueTasks.map((task) => (
                          <SelectItem key={task} value={task}>
                            {task}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Trade</label>
                    <Select value={tradeFilter} onValueChange={setTradeFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Trades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Trades</SelectItem>
                        {uniqueTrades.map((trade) => (
                          <SelectItem key={trade} value={trade}>
                            {trade?.replace('-', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Inspector</label>
                    <Select value={inspectorFilter} onValueChange={setInspectorFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All Inspectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Inspectors</SelectItem>
                        {uniqueInspectors.map((inspector) => (
                          <SelectItem key={inspector} value={inspector}>
                            {inspector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
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
                <Button variant="outline" size="sm" onClick={() => setShowBulkExport(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </Button>
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <Checkbox
                                checked={selectedItems.size === filteredInspections.length && filteredInspections.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                              <span className="text-xs text-muted-foreground">Select All</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select/deselect all visible inspection records</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
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
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
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
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>Inspection Status</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current status: Pass, Fail, Pending, or In Progress</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
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
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>Inspection Date</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>When the inspection was performed</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>Location Reference</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Specific location within the project site</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                    <th className="text-left py-3 px-4">
                      <TooltipProvider>
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
                      </TooltipProvider>
                    </th>
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