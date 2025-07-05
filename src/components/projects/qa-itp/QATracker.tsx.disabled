import React, { useState, useMemo, useCallback } from 'react';
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

const QATracker: React.FC<QATrackerProps> = ({ 
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

  // Computed values
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

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(inspection => {
      // Text search
      const searchMatch = !searchTerm || [
        inspection.task_area,
        inspection.inspection_number,
        inspection.inspector_name,
        inspection.location_reference,
        inspection.project_name
      ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const statusMatch = statusFilter === 'all' || inspection.overall_status === statusFilter;
      
      // Type filters
      const typeMatch = inspectionTypeFilter === 'all' || inspection.inspection_type === inspectionTypeFilter;
      const templateMatch = templateTypeFilter === 'all' || inspection.template_type === templateTypeFilter;
      const inspectorMatch = inspectorFilter === 'all' || inspection.inspector_name === inspectorFilter;

      // Date range filter
      let dateMatch = true;
      if (dateRangeFilter !== 'all' && inspection.inspection_date) {
        const inspectionDate = new Date(inspection.inspection_date);
        const now = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            dateMatch = inspectionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateMatch = inspectionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            dateMatch = inspectionDate >= monthAgo;
            break;
        }
      }

      return searchMatch && statusMatch && typeMatch && templateMatch && inspectorMatch && dateMatch;
    });
  }, [inspections, searchTerm, statusFilter, inspectionTypeFilter, templateTypeFilter, inspectorFilter, dateRangeFilter]);

  // Event handlers
  const handleSelectItem = useCallback((inspectionId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(inspectionId);
    } else {
      newSelection.delete(inspectionId);
    }
    setSelectedItems(newSelection);
  }, [selectedItems]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredInspections.map(i => i.id)));
    } else {
      setSelectedItems(new Set());
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'pending-reinspection': return '🔄';
      case 'incomplete-in-progress': return '⏳';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'pending-reinspection': return 'bg-orange-100 text-orange-800';
      case 'incomplete-in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || inspectionTypeFilter !== 'all' || 
    templateTypeFilter !== 'all' || inspectorFilter !== 'all' || dateRangeFilter !== 'all';

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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statusCounts.total || 0}</p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.pass || 0}</p>
              </div>
              <div className="text-lg">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.fail || 0}</p>
              </div>
              <div className="text-lg">❌</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts['pending-reinspection'] || 0}</p>
              </div>
              <div className="text-lg">🔄</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts['incomplete-in-progress'] || 0}</p>
              </div>
              <div className="text-lg">⏳</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Main search and filter toggle */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inspections by number, task area, inspector, location..."
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
                Advanced Filters
                {hasActiveFilters && <Badge variant="secondary" className="ml-1">Active</Badge>}
              </Button>
              
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
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
              <Button 
                variant={statusFilter === 'pass' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'pass' ? 'all' : 'pass')}
              >
                ✅ Passed ({statusCounts.pass || 0})
              </Button>
              <Button 
                variant={statusFilter === 'incomplete-in-progress' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'incomplete-in-progress' ? 'all' : 'incomplete-in-progress')}
              >
                ⏳ In Progress ({statusCounts['incomplete-in-progress'] || 0})
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">Inspection Type</label>
                  <Select value={inspectionTypeFilter} onValueChange={setInspectionTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="post-installation">Post Installation</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                      <SelectItem value="progress">Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Template Type</label>
                  <Select value={templateTypeFilter} onValueChange={setTemplateTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All templates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Templates</SelectItem>
                      <SelectItem value="doors-jambs-hardware">Doors, Jambs & Hardware</SelectItem>
                      <SelectItem value="skirting">Skirting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Inspector</label>
                  <Select value={inspectorFilter} onValueChange={setInspectorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All inspectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Inspectors</SelectItem>
                      {uniqueInspectors.map(inspector => (
                        <SelectItem key={inspector} value={inspector}>{inspector}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
                      <SelectItem value="incomplete-in-progress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedItems.size} inspection(s) selected</span>
                <Badge variant="secondary">{filteredInspections.length} total</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkExport(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDFs
                </Button>
                <Button variant="outline" onClick={() => setSelectedItems(new Set())}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspections List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Inspections ({filteredInspections.length})
                {hasActiveFilters && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (filtered from {inspections.length} total)
                  </span>
                )}
              </CardTitle>
              {filteredInspections.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedItems.size === filteredInspections.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label className="text-sm font-medium">Select All</label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredInspections.length > 0 ? (
              <div className="space-y-4">
                {filteredInspections.map((inspection) => (
                  <div key={inspection.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(inspection.id)}
                        onCheckedChange={(checked) => handleSelectItem(inspection.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        {/* Header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold">{inspection.inspection_number}</h3>
                          <Badge className={getStatusColor(inspection.overall_status)}>
                            {getStatusIcon(inspection.overall_status)} {inspection.overall_status?.replace('-', ' ').toUpperCase()}
                          </Badge>
                          {inspection.is_fire_door && (
                            <Badge variant="destructive" className="text-xs">🔥 Fire Door</Badge>
                          )}
                        </div>
                        
                        {/* Task Area */}
                        <p className="text-sm text-muted-foreground font-medium">{inspection.task_area}</p>
                        
                        {/* Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{inspection.inspector_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{inspection.location_reference}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            <span>{inspection.template_type?.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInspection(inspection)}
                          title="View Inspection"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingInspection(inspection);
                            setShowCreateForm(true);
                          }}
                          title="Edit Inspection"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this inspection?')) {
                              deleteInspection(inspection.id);
                            }
                          }}
                          title="Delete Inspection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground mb-4">No inspections match your current filters</p>
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">No inspections found for this project</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Inspection
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Modal */}
      {selectedInspection && (
        <QAInspectionModal
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          onUpdate={(updatedInspection) => {
            // Update the local state if needed
            setSelectedInspection(updatedInspection);
            // Trigger a refetch to ensure data consistency
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default QATracker;