
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, FileText, AlertTriangle } from 'lucide-react';

interface QAITPTrackerProps {
  onNewInspection: () => void;
}

const QAITPTracker: React.FC<QAITPTrackerProps> = ({ onNewInspection }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  // Sample data - in real app this would come from API
  const inspections = [
    {
      id: 1,
      project: 'Project Alpha',
      task: 'Door Installation',
      inspectionType: 'Final',
      status: 'pass',
      date: '2024-01-10',
      inspector: 'John Smith',
      evidenceCount: 3
    },
    {
      id: 2,
      project: 'Project Beta',
      task: 'Skirting Installation',
      inspectionType: 'Post-installation',
      status: 'fail',
      date: '2024-01-09',
      inspector: 'Sarah Johnson',
      evidenceCount: 2
    },
    {
      id: 3,
      project: 'Project Alpha',
      task: 'Door Jambs',
      inspectionType: 'Progress',
      status: 'pending-reinspection',
      date: '2024-01-08',
      inspector: 'Mike Wilson',
      evidenceCount: 4
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending Reinspection</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const statusMatch = filterStatus === 'all' || inspection.status === filterStatus;
    const projectMatch = filterProject === 'all' || inspection.project === filterProject;
    return statusMatch && projectMatch;
  });

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
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="Project Alpha">Project Alpha</SelectItem>
            <SelectItem value="Project Beta">Project Beta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="text-red-600 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Failed Inspections ({inspections.filter(i => i.status === 'fail').length})
        </Button>
        <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-200">
          Pending Reinspection ({inspections.filter(i => i.status === 'pending-reinspection').length})
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
                  Evidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {inspection.project}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.task}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.inspectionType}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(inspection.status)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(inspection.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.inspector}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inspection.evidenceCount} files
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        PDF
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
          <p className="text-gray-500">No inspections found matching the selected filters.</p>
          <Button onClick={onNewInspection} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create First QA Inspection
          </Button>
        </div>
      )}
    </div>
  );
};

export default QAITPTracker;
