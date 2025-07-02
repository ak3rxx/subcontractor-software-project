import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { Plus, Search, Filter, AlertCircle, CheckCircle2, XCircle, Clock, Eye, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import QAITPFormSimple from './QAITPFormSimple';
import QAInspectionViewer from './QAInspectionViewer';

interface QAITPTrackerSimpleProps {
  onNewInspection: () => void;
  projectId: string;
}

const QAITPTrackerSimple: React.FC<QAITPTrackerSimpleProps> = ({ 
  onNewInspection, 
  projectId 
}) => {
  const { 
    inspections, 
    loading, 
    deleteInspection
  } = useQAInspectionsSimple(projectId);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [selectedInspection, setSelectedInspection] = useState<string | null>(null);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending-reinspection':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'incomplete-in-progress':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
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

  // Extract unique buildings and levels
  const buildings = useMemo(() => {
    const buildingSet = new Set<string>();
    inspections.forEach(inspection => {
      if (inspection.location_reference) {
        const parts = inspection.location_reference.split(' - ');
        if (parts[0] && parts[0].trim()) {
          buildingSet.add(parts[0].trim());
        }
      }
    });
    return Array.from(buildingSet).sort();
  }, [inspections]);

  const levels = useMemo(() => {
    const levelSet = new Set<string>();
    inspections.forEach(inspection => {
      if (inspection.location_reference) {
        const parts = inspection.location_reference.split(' - ');
        if (parts[1] && parts[1].trim()) {
          const level = parts[1].replace('Level ', '').trim();
          if (level) {
            levelSet.add(level);
          }
        }
      }
    });
    return Array.from(levelSet).sort();
  }, [inspections]);

  const filteredInspections = useMemo(() => {
    return inspections.filter(inspection => {
      const matchesSearch = !searchTerm || 
        inspection.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.task_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.location_reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || inspection.overall_status === statusFilter;
      
      // Building filter  
      const locationParts = inspection.location_reference ? inspection.location_reference.split(' - ') : [];
      const building = locationParts[0] ? locationParts[0].trim() : '';
      const matchesBuilding = buildingFilter === 'all' || building === buildingFilter;
      
      // Level filter
      const level = locationParts[1] ? locationParts[1].replace('Level ', '').trim() : '';
      const matchesLevel = levelFilter === 'all' || level === levelFilter;
      
      return matchesSearch && matchesStatus && matchesBuilding && matchesLevel;
    });
  }, [inspections, searchTerm, statusFilter, buildingFilter, levelFilter]);

  const handleDeleteInspection = async (inspectionId: string) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      await deleteInspection(inspectionId);
    }
  };

  if (selectedInspection) {
    return (
      <QAInspectionViewer
        inspectionId={selectedInspection}
        onClose={() => setSelectedInspection(null)}
        onEdit={(inspection) => {
          setSelectedInspection(null);
          setEditingInspection(inspection);
        }}
      />
    );
  }

  if (editingInspection) {
    return (
      <QAITPFormSimple
        onClose={() => setEditingInspection(null)}
        projectId={projectId}
        editingInspection={editingInspection}
      />
    );
  }

  if (showNewForm) {
    return (
      <QAITPFormSimple
        onClose={() => setShowNewForm(false)}
        projectId={projectId}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>QA/ITP Inspections</CardTitle>
            <Button onClick={() => setShowNewForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by inspection number, task area, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                  <option value="pending-reinspection">Pending Reinspection</option>
                  <option value="incomplete-in-progress">In Progress</option>
                </select>
              </div>
            </div>
            
            {/* Building and Level Filters */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Building:</label>
                <select
                  value={buildingFilter}
                  onChange={(e) => setBuildingFilter(e.target.value)}
                  className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="all">All Buildings</option>
                  {buildings.map(building => (
                    <option key={building} value={building}>{building}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Level:</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="all">All Levels</option>
                  {levels.map(level => (
                    <option key={level} value={level}>Level {level}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Search Results Info */}
            {(searchTerm || statusFilter !== 'all' || buildingFilter !== 'all' || levelFilter !== 'all') && (
              <div className="text-sm text-muted-foreground">
                {searchTerm && `Searching for "${searchTerm}" • `}
                {filteredInspections.length} inspection{filteredInspections.length !== 1 ? 's' : ''} found
                {statusFilter !== 'all' && ` • Status: ${statusFilter}`}
                {buildingFilter !== 'all' && ` • Building: ${buildingFilter}`}
                {levelFilter !== 'all' && ` • Level: ${levelFilter}`}
              </div>
            )}
          </div>

          {filteredInspections.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {inspections.length === 0 ? 'No Inspections Yet' : 'No Matching Inspections'}
              </h3>
              <p className="text-gray-600 mb-6">
                {inspections.length === 0 
                  ? 'Create your first QA inspection to get started' 
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {inspections.length === 0 && (
                <Button onClick={() => setShowNewForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Inspection
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInspections.map((inspection) => (
                <div key={inspection.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{inspection.inspection_number}</h4>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(inspection.overall_status)}
                          <Badge className={getStatusColor(inspection.overall_status)}>
                            {inspection.overall_status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                        <div><strong>Task Area:</strong> {inspection.task_area}</div>
                        <div><strong>Location:</strong> {inspection.location_reference}</div>
                        <div><strong>Type:</strong> {inspection.inspection_type.replace('-', ' ')}</div>
                        <div><strong>Trade Item:</strong> {inspection.template_type.replace('-', ' ')}</div>
                        <div><strong>Inspector:</strong> {inspection.inspector_name}</div>
                        <div><strong>Date:</strong> {format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}</div>
                      </div>
                      
                      {inspection.is_fire_door && (
                        <Badge variant="secondary" className="text-xs">Fire Door</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInspection(inspection.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingInspection(inspection)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInspection(inspection.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAITPTrackerSimple;