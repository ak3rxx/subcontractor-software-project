import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQAInspections, QAInspection, QAChecklistItem } from '@/hooks/useQAInspections';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { useQAPermissions } from '@/hooks/useQAPermissions';
import { FileText, Calendar, User, MapPin, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface QAInspectionViewerProps {
  inspectionId: string;
  onClose?: () => void;
  onEdit?: (inspection: QAInspection) => void;
}

const QAInspectionViewer: React.FC<QAInspectionViewerProps> = ({
  inspectionId,
  onClose,
  onEdit
}) => {
  const [inspection, setInspection] = useState<QAInspection | null>(null);
  const [checklistItems, setChecklistItems] = useState<QAChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { getInspectionById, getChecklistItems } = useQAInspections();
  const { changeHistory, loading: historyLoading } = useQAChangeHistory(inspectionId);
  const { canEditInspections, canViewAuditTrail } = useQAPermissions();

  useEffect(() => {
    const fetchInspectionData = async () => {
      if (!inspectionId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const [inspectionData, checklistData] = await Promise.all([
          getInspectionById(inspectionId),
          getChecklistItems(inspectionId)
        ]);

        setInspection(inspectionData);
        setChecklistItems(checklistData);
      } catch (error) {
        console.error('Error fetching inspection data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionData();
  }, [inspectionId]); // Remove function dependencies to prevent loops

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending-reinspection':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'incomplete-in-progress':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Inspection not found</p>
        {onClose && (
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">QA Inspection {inspection.inspection_number}</h2>
          <p className="text-muted-foreground">{inspection.project_name}</p>
        </div>
        <div className="flex gap-2">
          {canEditInspections && onEdit && (
            <Button onClick={() => onEdit(inspection)}>
              Edit Inspection
            </Button>
          )}
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Status and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Inspection Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon(inspection.overall_status)}
                <Badge className={getStatusColor(inspection.overall_status)}>
                  {inspection.overall_status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Inspection Type</label>
              <p className="mt-1 capitalize">{inspection.inspection_type.replace('-', ' ')}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Template</label>
              <p className="mt-1 capitalize">{inspection.template_type.replace('-', ' ')}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Inspector</label>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4" />
                <span>{inspection.inspector_name}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Location</label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4" />
                <span>{inspection.location_reference}</span>
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Task Area</label>
            <p className="mt-1">{inspection.task_area}</p>
          </div>
          
          {inspection.is_fire_door && (
            <div>
              <Badge variant="secondary">Fire Door Inspection</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checklist Items */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {checklistItems.length > 0 ? (
            <div className="space-y-4">
              {checklistItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{item.description}</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <Badge className={getStatusColor(item.status)}>
                        {item.status || 'Not Checked'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.requirements}
                  </p>
                  
                  {item.comments && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Comments:</label>
                      <p className="text-sm mt-1">{item.comments}</p>
                    </div>
                  )}
                  
                  {item.evidence_files && item.evidence_files.length > 0 && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-muted-foreground">Evidence Files:</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.evidence_files.map((file, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            📎 File {index + 1}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No checklist items found</p>
          )}
        </CardContent>
      </Card>

      {/* Digital Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Signature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-mono text-lg">{inspection.digital_signature}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Signed by {inspection.inspector_name} on {format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change History */}
      {canViewAuditTrail && (
        <Card>
          <CardHeader>
            <CardTitle>Change History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : changeHistory.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {changeHistory.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-muted pl-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium">
                            {entry.field_name} changed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.user_name} • {format(new Date(entry.change_timestamp), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {entry.change_type}
                        </Badge>
                      </div>
                      {entry.old_value && entry.new_value && (
                        <div className="text-xs mt-1 space-y-1">
                          <p><span className="text-red-600">From:</span> {entry.old_value}</p>
                          <p><span className="text-green-600">To:</span> {entry.new_value}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No changes recorded</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QAInspectionViewer;