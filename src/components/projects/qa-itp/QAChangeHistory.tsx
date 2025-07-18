
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Edit, Plus, FileText, Check, X, AlertCircle } from 'lucide-react';

interface ChangeHistoryEntry {
  id: string;
  timestamp?: string;
  change_timestamp?: string;
  user_id: string;
  user_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: string;
  item_id?: string;
  item_description?: string;
}

interface QAChangeHistoryProps {
  inspectionId: string;
  changeHistory: ChangeHistoryEntry[];
}

const QAChangeHistory: React.FC<QAChangeHistoryProps> = ({ inspectionId, changeHistory }) => {
  console.log('QA Change History: Rendering with', {
    inspectionId,
    changeHistoryCount: changeHistory?.length || 0
  });

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'update':
        return <Edit className="h-3 w-3 text-blue-600" />;
      case 'delete':
        return <X className="h-3 w-3 text-red-600" />;
      default:
        return <Edit className="h-3 w-3 text-gray-600" />;
    }
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'create':
        return <Badge className="bg-green-100 text-green-800">Created</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800">Updated</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">Deleted</Badge>;
      default:
        return <Badge variant="outline">Changed</Badge>;
    }
  };

  const getFieldIcon = (fieldName: string) => {
    if (fieldName === 'status') return <Check className="h-3 w-3" />;
    if (fieldName === 'evidenceFiles') return <FileText className="h-3 w-3" />;
    if (fieldName === 'attachments') return <FileText className="h-3 w-3" />;
    if (fieldName === 'comments') return <Edit className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const formatFieldName = (fieldName: string) => {
    const fieldMap: { [key: string]: string } = {
      'evidenceFiles': 'Evidence Files',
      'status': 'Status',
      'comments': 'Comments',
      'attachments': 'Attachments',
      'inspector_name': 'Inspector Name',
      'inspection_date': 'Inspection Date',
      'overall_status': 'Overall Status'
    };
    
    return fieldMap[fieldName] || fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (entry: ChangeHistoryEntry) => {
    const timestamp = entry.change_timestamp || entry.timestamp;
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getValueColor = (isOld: boolean) => {
    return isOld ? 'text-red-700' : 'text-green-700';
  };

  // Filter out potential duplicates based on content and timing
  const filteredHistory = React.useMemo(() => {
    const seen = new Set<string>();
    return changeHistory.filter(entry => {
      const key = `${entry.field_name}-${entry.old_value}-${entry.new_value}-${entry.item_id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [changeHistory]);

  if (!filteredHistory || filteredHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No changes recorded yet.</p>
            <p className="text-xs mt-2">Changes will appear here as you edit this inspection.</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Change History ({filteredHistory.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-3 space-y-2" data-history-item>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getChangeTypeIcon(entry.change_type)}
                  {getChangeTypeBadge(entry.change_type)}
                  <div className="flex items-center gap-1">
                    {getFieldIcon(entry.field_name)}
                    <span className="text-sm font-medium" data-history-field>{formatFieldName(entry.field_name)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  <span data-history-user>{entry.user_name}</span>
                </div>
              </div>
              
              {entry.item_description && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Checklist Item:</strong> {entry.item_description}
                </div>
              )}
              
              <div className="text-sm space-y-1">
                {entry.old_value && (
                  <div className={getValueColor(true)}>
                    <strong>From:</strong> <span data-history-old-value>{entry.old_value}</span>
                  </div>
                )}
                {entry.new_value && (
                  <div className={getValueColor(false)}>
                    <strong>To:</strong> <span data-history-new-value>{entry.new_value}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 p-1 rounded">
                <Clock className="h-3 w-3" />
                <span data-history-timestamp>{formatTimestamp(entry)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QAChangeHistory;
