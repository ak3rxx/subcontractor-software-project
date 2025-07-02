import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQAInspections } from '@/hooks/useQAInspections';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import FileThumbnailViewer from './FileThumbnailViewer';

interface QAChecklistTabProps {
  inspection: any;
  isEditing: boolean;
}

const QAChecklistTab: React.FC<QAChecklistTabProps> = ({
  inspection,
  isEditing
}) => {
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getChecklistItems } = useQAInspections();

  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (inspection?.id) {
        setLoading(true);
        try {
          const items = await getChecklistItems(inspection.id);
          setChecklistItems(items);
        } catch (error) {
          console.error('Error fetching checklist items:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchChecklistItems();
  }, [inspection?.id, getChecklistItems]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'na':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'na':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto h-full">
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
                        {item.status === 'na' ? 'N/A' : (item.status || 'Not Checked').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.requirements}
                  </p>
                  
                  {item.comments && (
                    <div className="mb-2">
                      <label className="text-sm font-medium text-muted-foreground">Comments:</label>
                      <p className="text-sm mt-1 bg-muted p-2 rounded">{item.comments}</p>
                    </div>
                  )}
                  
                  {item.evidence_files && item.evidence_files.length > 0 && (
                    <FileThumbnailViewer 
                      files={item.evidence_files} 
                      className="mt-2"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No checklist items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAChecklistTab;