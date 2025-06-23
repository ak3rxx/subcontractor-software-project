
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Edit, Plus } from 'lucide-react';

interface ChangeHistoryEntry {
  id: string;
  timestamp?: string;
  change_timestamp?: string;
  user_id: string;
  user_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'create' | 'update' | 'delete';
  item_id?: string;
  item_description?: string;
}

interface QAChangeHistoryProps {
  inspectionId: string;
  changeHistory: ChangeHistoryEntry[];
}

const QAChangeHistory: React.FC<QAChangeHistoryProps> = ({ inspectionId, changeHistory }) => {
  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'update':
        return <Edit className="h-3 w-3 text-blue-600" />;
      case 'delete':
        return <Edit className="h-3 w-3 text-red-600" />;
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

  const formatFieldName = (fieldName: string) => {
    return fieldName
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

  if (changeHistory.length === 0) {
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
          Change History ({changeHistory.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-3">
          {changeHistory.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getChangeTypeIcon(entry.change_type)}
                  {getChangeTypeBadge(entry.change_type)}
                  <span className="text-sm font-medium">{formatFieldName(entry.field_name)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  {entry.user_name}
                </div>
              </div>
              
              {entry.item_description && (
                <div className="text-sm text-gray-600">
                  <strong>Item:</strong> {entry.item_description}
                </div>
              )}
              
              <div className="text-sm space-y-1">
                {entry.old_value && (
                  <div className="text-red-700">
                    <strong>From:</strong> {entry.old_value}
                  </div>
                )}
                {entry.new_value && (
                  <div className="text-green-700">
                    <strong>To:</strong> {entry.new_value}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatTimestamp(entry)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QAChangeHistory;
