import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Edit, User, Calendar, MapPin, Clipboard, History } from 'lucide-react';
import { format } from 'date-fns';
import { useQAInspectionsSimple } from '@/hooks/useQAInspectionsSimple';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import QAChangeHistory from './QAChangeHistory';

interface QAInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: any;
  onEdit: () => void;
}

const QAInspectionModal: React.FC<QAInspectionModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onEdit
}) => {
  const { getChecklistItems } = useQAInspectionsSimple(inspection?.project_id);
  const { changeHistory } = useQAChangeHistory(inspection?.id);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load checklist items when modal opens
  React.useEffect(() => {
    if (inspection?.id && isOpen) {
      setLoadingItems(true);
      getChecklistItems(inspection.id).then(items => {
        setChecklistItems(items);
        setLoadingItems(false);
      });
    }
  }, [inspection?.id, isOpen, getChecklistItems]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">✅ Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">❌ Fail</Badge>;
      case 'pending-reinspection':
        return <Badge className="bg-orange-100 text-orange-800">🔄 Pending Reinspection</Badge>;
      case 'incomplete-in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">⏳ In Progress</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'na':
        return '⚪';
      default:
        return '❓';
    }
  };

  if (!inspection) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                QA Inspection {inspection.inspection_number}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <h3 className="text-lg font-semibold">{inspection.task_area}</h3>
                {getStatusBadge(inspection.overall_status)}
                {inspection.is_fire_door && (
                  <Badge variant="destructive" className="text-xs">🔥 Fire Door</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Tabs defaultValue="details" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="history">Audit Trail</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="h-full overflow-y-auto mt-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Inspection Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Inspector</p>
                        <p className="text-sm text-muted-foreground">{inspection.inspector_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Inspection Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(inspection.inspection_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{inspection.location_reference}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clipboard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Template Type</p>
                        <p className="text-sm text-muted-foreground">
                          {inspection.template_type?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <p className="text-sm font-medium">Project Name</p>
                      <p className="text-sm text-muted-foreground">{inspection.project_name}</p>
                    </div>
                  </CardContent>
                </Card>

                {inspection.digital_signature && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Digital Signature</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{inspection.digital_signature}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="h-full overflow-y-auto mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inspection Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingItems ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : checklistItems.length > 0 ? (
                    <div className="space-y-4">
                      {checklistItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{item.description}</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-lg">{getStatusIcon(item.status)}</span>
                              <span className="text-sm font-medium capitalize">{item.status || 'Not set'}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.requirements}</p>
                          {item.comments && (
                            <div className="bg-muted p-2 rounded text-sm">
                              <strong>Comments:</strong> {item.comments}
                            </div>
                          )}
                          {item.evidence_files && item.evidence_files.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium mb-1">Evidence Files:</p>
                              <div className="flex flex-wrap gap-2">
                                {item.evidence_files.map((file: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    📎 {file.split('/').pop()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clipboard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No checklist items found.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="h-full overflow-y-auto mt-4">
              <QAChangeHistory
                inspectionId={inspection.id}
                changeHistory={changeHistory}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QAInspectionModal;