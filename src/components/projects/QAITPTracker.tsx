
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Filter, FileText, AlertTriangle, Eye, Edit, Trash2 } from 'lucide-react';
import { useQAInspections } from '@/hooks/useQAInspections';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';
import QAInspectionViewer from './qa-itp/QAInspectionViewer';

interface QAITPTrackerProps {
  onNewInspection: () => void;
}

const QAITPTracker: React.FC<QAITPTrackerProps> = ({ onNewInspection }) => {
  const { inspections, loading, bulkDeleteInspections } = useQAInspections();
  const { projects } = useProjects();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedInspections, setSelectedInspections] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Reinspection</Badge>;
      case 'incomplete-in-progress':
        return <Badge className="bg-blue-100 text-blue-800">Incomplete/In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const statusMatch = filterStatus === 'all' || inspection.overall_status === filterStatus;
    const projectMatch = filterProject === 'all' || inspection.project_id === filterProject;
    return statusMatch && projectMatch;
  });

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const handleSelectInspection = (inspectionId: string, checked: boolean) => {
    if (checked) {
      setSelectedInspections(prev => [...prev, inspectionId]);
    } else {
      setSelectedInspections(prev => prev.filter(id => id !== inspectionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInspections(filteredInspections.map(i => i.id));
    } else {
      setSelectedInspections([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInspections.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedInspections.length} inspection(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const success = await bulkDeleteInspections(selectedInspections);
      if (success) {
        setSelectedInspections([]);
        toast({
          title: "Success",
          description: `Successfully deleted ${selectedInspections.length} inspection(s)`,
        });
      }
    } catch (error) {
      console.error('Error deleting inspections:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspections",
        variant: "destructive"
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  if (selectedInspectionId) {
    return (
      <QAInspectionViewer
        inspectionId={selectedInspectionId}
        onClose={() => setSelectedInspectionId(null)}
        canEdit={true}
      />
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading inspections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
            <SelectItem value="pending-reinspection">Pending Reinspection</SelectItem>
            <SelectItem value="incomplete-in-progress">Incomplete/In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedInspections.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedInspections.length} inspection(s) selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedInspections([])}
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="text-red-600 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Failed Inspections ({inspections.filter(i => i.overall_status === 'fail').length})
        </Button>
        <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-200">
          Pending Reinspection ({inspections.filter(i => i.overall_status === 'pending-reinspection').length})
        </Button>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200">
          In Progress ({inspections.filter(i => i.overall_status === 'incomplete-in-progress').length})
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Checkbox
                    checked={selectedInspections.length === filteredInspections.length && filteredInspections.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspection #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspection Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspector
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Checkbox
                      checked={selectedInspections.includes(inspection.id)}
                      onCheckedChange={(checked) => handleSelectInspection(inspection.id, checked as boolean)}
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inspection.inspection_number}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getProjectName(inspection.project_id)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.task_area}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.inspection_type}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(inspection.overall_status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(inspection.inspection_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.inspector_name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedInspectionId(inspection.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedInspectionId(inspection.id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInspections.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {inspections.length === 0 
              ? "No QA inspections created yet." 
              : "No inspections found matching the selected filters."}
          </p>
          <Button onClick={onNewInspection} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            {inspections.length === 0 ? "Create First QA Inspection" : "Create New Inspection"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default QAITPTracker;
