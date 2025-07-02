
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Eye, Download, Trash2 } from 'lucide-react';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { format } from 'date-fns';
import QAITPForm from './QAITPForm';
import QAInspectionModal from './QAInspectionModal';

interface QAITPTrackerProps {
  onNewInspection: () => void;
  projectId: string;
}

const QAITPTracker: React.FC<QAITPTrackerProps> = ({ 
  onNewInspection, 
  projectId 
}) => {
  const { inspections, loading, deleteInspection } = useQAInspectionsSimple(projectId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [editingInspection, setEditingInspection] = useState<any>(null);

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

  const handleDelete = async (inspectionId: string) => {
    if (window.confirm('Are you sure you want to delete this inspection?')) {
      await deleteInspection(inspectionId);
    }
  };

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
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Inspection
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Inspections ({inspections.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {inspections.length > 0 ? (
              <div className="space-y-4">
                {inspections.map((inspection) => (
                  <div key={inspection.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4" />
                          <h3 className="font-semibold">{inspection.inspection_number}</h3>
                          <Badge className={getStatusColor(inspection.overall_status)}>
                            {getStatusIcon(inspection.overall_status)} {inspection.overall_status?.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{inspection.task_area}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Inspector: {inspection.inspector_name}</span>
                          <span>Date: {format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}</span>
                          <span>Type: {inspection.inspection_type?.replace('-', ' ')}</span>
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
                <p className="text-muted-foreground mb-4">No inspections found</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Inspection
                </Button>
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
          onInspectionUpdate={(updated) => {
            setSelectedInspection(updated);
          }}
        />
      )}
    </div>
  );
};

export default QAITPTracker;
