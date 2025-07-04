import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, FileText, Eye, Download, Trash2, Filter, Search, X } from 'lucide-react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { format } from 'date-fns';
import QAITPForm from './QAITPForm';
import QAInspectionModal from './QAInspectionModal';

interface QATrackerEnhancedProps {
  onNewInspection: () => void;
  projectId: string;
}

const QATrackerEnhanced: React.FC<QATrackerEnhancedProps> = ({ 
  onNewInspection, 
  projectId 
}) => {
  const { inspections, loading, deleteInspection } = useQAInspectionsSimple(projectId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectionTypeFilter, setInspectionTypeFilter] = useState('all');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter(inspection => {
      const matchesSearch = searchTerm === '' || 
        inspection.task_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.inspector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.location_reference.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || inspection.overall_status === statusFilter;
      const matchesInspectionType = inspectionTypeFilter === 'all' || inspection.inspection_type === inspectionTypeFilter;
      const matchesTemplateType = templateTypeFilter === 'all' || inspection.template_type === templateTypeFilter;
      
      // Extract building/level from location_reference
      const location = inspection.location_reference || '';
      const buildingMatch = buildingFilter === 'all' || location.toLowerCase().includes(buildingFilter.toLowerCase());
      const levelMatch = levelFilter === 'all' || location.toLowerCase().includes(levelFilter.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesInspectionType && matchesTemplateType && buildingMatch && levelMatch;
    });
  }, [inspections, searchTerm, statusFilter, inspectionTypeFilter, templateTypeFilter, buildingFilter, levelFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'pending-reinspection':
        return '🔄';
      case 'incomplete-in-progress':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'pending-reinspection':
        return 'bg-orange-100 text-orange-800';
      case 'incomplete-in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectItem = (inspectionId: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(inspectionId);
    } else {
      newSelection.delete(inspectionId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredInspections.map(i => i.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} inspection(s)?`)) {
      for (const id of selectedItems) {
        await deleteInspection(id);
      }
      setSelectedItems(new Set());
    }
  };

  const handleBulkPDFExport = async () => {
    if (selectedItems.size === 0) return;
    
    try {
      const selectedInspections = inspections.filter(i => selectedItems.has(i.id));
      const { exportMultipleInspectionsToPDF, downloadPDF } = await import('@/utils/pdfExport');
      
      // Create temporary elements for each inspection
      const elements = selectedInspections.map(inspection => {
        const tempElement = document.createElement('div');
        tempElement.setAttribute('data-inspection-viewer', 'true');
        tempElement.innerHTML = `
          <div data-project-name="${inspection.project_name}"></div>
          <div data-task-area="${inspection.task_area}"></div>
          <div data-location-reference="${inspection.location_reference}"></div>
          <div data-inspector-name="${inspection.inspector_name}"></div>
          <div data-inspection-date="${inspection.inspection_date}"></div>
          <div data-overall-status="${inspection.overall_status}"></div>
        `;
        return tempElement;
      });
      
      const blob = await exportMultipleInspectionsToPDF(elements, selectedInspections.map(i => ({
        id: i.id,
        inspection_number: i.inspection_number,
        project_name: i.project_name,
        task_area: i.task_area,
        inspector_name: i.inspector_name,
        inspection_date: i.inspection_date,
        overall_status: i.overall_status
      })));
      
      downloadPDF(blob, `bulk_inspections_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting bulk PDF:', error);
    }
  };

  const handleDelete = async (inspectionId: string) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      await deleteInspection(inspectionId);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setInspectionTypeFilter('all');
    setTemplateTypeFilter('all');
    setBuildingFilter('all');
    setLevelFilter('all');
  };

  // Get unique buildings and levels from inspection locations
  const uniqueBuildings = useMemo(() => {
    const buildings = new Set<string>();
    inspections.forEach(inspection => {
      const location = inspection.location_reference || '';
      const buildingMatch = location.match(/building\s+(\w+)/i);
      if (buildingMatch) buildings.add(buildingMatch[1]);
    });
    return Array.from(buildings).sort();
  }, [inspections]);

  const uniqueLevels = useMemo(() => {
    const levels = new Set<string>();
    inspections.forEach(inspection => {
      const location = inspection.location_reference || '';
      const levelMatch = location.match(/level\s+(\w+)/i);
      if (levelMatch) levels.add(levelMatch[1]);
    });
    return Array.from(levels).sort();
  }, [inspections]);

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || inspectionTypeFilter !== 'all' || templateTypeFilter !== 'all' || buildingFilter !== 'all' || levelFilter !== 'all';

  if (showCreateForm) {
    return (
      <QAITPForm
        projectId={projectId}
        editingInspection={editingInspection}
        onClose={() => {
          setShowCreateForm(false);
          setEditingInspection(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">QA/ITP Tracker</h2>
          <p className="text-muted-foreground">Manage quality assurance inspections and test plans</p>
        </div>
              <Button onClick={() => setShowCreateForm(true)} data-tour="new-inspection-btn">
                <Plus className="h-4 w-4 mr-2" />
                New Inspection
              </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
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
                onClick={() => setShowFilters(!showFilters)}
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

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t">
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
                  <label className="text-sm font-medium mb-2 block">Building</label>
                  <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All buildings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Buildings</SelectItem>
                      {uniqueBuildings.map(building => (
                        <SelectItem key={building} value={building}>Building {building}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Level</label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {uniqueLevels.map(level => (
                        <SelectItem key={level} value={level}>Level {level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Quick filter buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={statusFilter === 'fail' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'fail' ? 'all' : 'fail')}
              >
                ❌ Failed ({inspections.filter(i => i.overall_status === 'fail').length})
              </Button>
              <Button 
                variant={statusFilter === 'pending-reinspection' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'pending-reinspection' ? 'all' : 'pending-reinspection')}
              >
                🔄 Pending ({inspections.filter(i => i.overall_status === 'pending-reinspection').length})
              </Button>
              <Button 
                variant={statusFilter === 'pass' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setStatusFilter(statusFilter === 'pass' ? 'all' : 'pass')}
              >
                ✅ Passed ({inspections.filter(i => i.overall_status === 'pass').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">{selectedItems.size} inspection(s) selected</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBulkPDFExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDFs
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inspections ({filteredInspections.length})</CardTitle>
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
                  <div key={inspection.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(inspection.id)}
                        onCheckedChange={(checked) => handleSelectItem(inspection.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4" />
                          <h3 className="font-semibold">{inspection.inspection_number}</h3>
                          <Badge className={getStatusColor(inspection.overall_status)}>
                            {getStatusIcon(inspection.overall_status)} {inspection.overall_status?.replace('-', ' ').toUpperCase()}
                          </Badge>
                          {inspection.is_fire_door && (
                            <Badge variant="destructive" className="text-xs">🔥 Fire Door</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{inspection.task_area}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Inspector: {inspection.inspector_name}</span>
                          <span>Date: {format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}</span>
                          <span>Type: {inspection.inspection_type?.replace('-', ' ')}</span>
                          <span>Location: {inspection.location_reference}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInspection(inspection)}
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
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(inspection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground mb-4">No inspections match your filters</p>
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">No inspections found</p>
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

      {selectedInspection && (
        <QAInspectionModal
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          inspection={selectedInspection}
          onEdit={() => {
            setEditingInspection(selectedInspection);
            setSelectedInspection(null);
            setShowCreateForm(true);
          }}
        />
      )}
    </div>
  );
};

export default QATrackerEnhanced;