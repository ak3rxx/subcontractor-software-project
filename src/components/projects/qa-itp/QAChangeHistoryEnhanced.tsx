import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, XCircle, Clock, Send, MessageSquare, FileText, 
  Unlock, History, Loader2, Upload, Trash2, Edit3, Eye, User, Calendar
} from 'lucide-react';
import { QAAuditTrailEntry } from '@/hooks/useQAAuditTrailFetch';

interface QAChangeHistoryEnhancedProps {
  auditTrail: QAAuditTrailEntry[];
  loading: boolean;
  refreshing?: boolean;
}

const QAChangeHistoryEnhanced: React.FC<QAChangeHistoryEnhancedProps> = ({
  auditTrail,
  loading,
  refreshing = false
}) => {
  const getActionIcon = (fieldName: string, changeType: string) => {
    // File-related changes
    if (fieldName === 'evidenceFiles' || fieldName === 'inspection_attachments') {
      return <Upload className="h-4 w-4 text-green-600" />;
    }
    
    // Session-related changes
    if (fieldName === 'edit_session') {
      return <Edit3 className="h-4 w-4 text-blue-600" />;
    }
    
    // Status changes
    if (fieldName === 'overall_status') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    // Checklist item changes
    if (fieldName === 'status') {
      return <CheckCircle className="h-4 w-4 text-orange-600" />;
    }
    
    if (fieldName === 'comments') {
      return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
    
    // General field changes
    switch (changeType) {
      case 'create':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'update':
        return <Edit3 className="h-4 w-4 text-orange-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatActionType = (entry: QAAuditTrailEntry) => {
    const { field_name, change_type, item_id, item_description } = entry;
    
    // File changes
    if (field_name === 'evidenceFiles') {
      return `Updated evidence files${item_description ? ` for ${item_description}` : ''}`;
    }
    
    if (field_name === 'inspection_attachments') {
      return 'Updated inspection attachments';
    }
    
    // Session changes
    if (field_name === 'edit_session') {
      const newValue = entry.new_value?.toLowerCase();
      if (newValue === 'active') return 'Started editing session';
      if (newValue === 'saved') return 'Saved changes';
      if (newValue === 'failed') return 'Save failed';
      if (newValue === 'cancelled') return 'Cancelled editing';
      return 'Session activity';
    }
    
    // Status changes
    if (field_name === 'overall_status') {
      return 'Updated inspection status';
    }
    
    // Checklist item changes
    if (item_id && item_description) {
      if (field_name === 'status') {
        return `Updated status for checklist item`;
      }
      if (field_name === 'comments') {
        return `Updated comments for checklist item`;
      }
      return `Updated ${field_name.replace(/_/g, ' ')} for checklist item`;
    }
    
    // General field changes
    return `Updated ${field_name.replace(/_/g, ' ')}`;
  };

  const getStatusBadge = (oldValue: string | null, newValue: string | null, fieldName: string) => {
    // For status fields, show the new status as a badge
    if (fieldName === 'overall_status' || fieldName === 'status') {
      if (!newValue) return null;
      
      switch (newValue.toLowerCase()) {
        case 'pass':
          return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
        case 'fail':
          return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
        case 'na':
          return <Badge className="bg-gray-100 text-gray-800">N/A</Badge>;
        case 'pending-reinspection':
          return <Badge className="bg-orange-100 text-orange-800">Pending Reinspection</Badge>;
        case 'incomplete-in-progress':
          return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
        default:
          return <Badge variant="outline">{newValue}</Badge>;
      }
    }
    
    return null;
  };

  const formatFieldChange = (entry: QAAuditTrailEntry) => {
    const { field_name, old_value, new_value } = entry;
    
    if (!old_value && !new_value) return null;
    
    const fieldName = field_name.replace(/_/g, ' ');
    
    // Special formatting for files
    if (field_name === 'evidenceFiles' || field_name === 'inspection_attachments') {
      return (
        <div className="text-sm text-gray-700 bg-green-50 p-2 rounded border">
          <span className="font-medium">File change:</span> {new_value || 'Files updated'}
        </div>
      );
    }
    
    // Session changes
    if (field_name === 'edit_session') {
      return (
        <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded border">
          <span className="font-medium">Session:</span> {old_value} → {new_value}
        </div>
      );
    }
    
    // Status changes
    if (field_name === 'overall_status' || field_name === 'status') {
      return (
        <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded border">
          <span className="font-medium">{fieldName}:</span> {old_value || 'Not set'} → {new_value || 'Not set'}
        </div>
      );
    }
    
    // Comments
    if (field_name === 'comments') {
      return (
        <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded border">
          <span className="font-medium">Comments updated</span>
          {new_value && (
            <div className="mt-1 text-xs text-gray-600 italic">
              "{new_value.length > 100 ? new_value.substring(0, 100) + '...' : new_value}"
            </div>
          )}
        </div>
      );
    }
    
    // General field changes
    return (
      <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded border">
        <span className="font-medium">{fieldName}:</span> {old_value || 'Not set'} → {new_value || 'Not set'}
      </div>
    );
  };

  // Remove duplicates and show all audit trail entries
  const displayableEntries = React.useMemo(() => {
    const seen = new Set();
    return auditTrail.filter(entry => {
      // Create a unique key for each entry to detect duplicates
      const key = `${entry.change_type}-${entry.field_name}-${entry.change_timestamp}-${entry.user_id}-${entry.item_id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [auditTrail]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Change History
          {displayableEntries.length > 0 && (
            <Badge variant="outline">{displayableEntries.length}</Badge>
          )}
          {refreshing && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !refreshing ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading change history...</span>
          </div>
        ) : displayableEntries.length > 0 ? (
          <ScrollArea className="h-80">
            <div className="space-y-4 pr-4">
              {displayableEntries.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5">
                    {getActionIcon(entry.field_name, entry.change_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{formatActionType(entry)}</span>
                      {getStatusBadge(entry.old_value, entry.new_value, entry.field_name)}
                    </div>
                    
                    {/* Checklist item context */}
                    {entry.item_id && entry.item_description && (
                      <div className="text-xs text-blue-600 mb-1 bg-blue-50 px-2 py-1 rounded">
                        <span className="font-medium">Checklist Item:</span> {entry.item_description}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{entry.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(entry.change_timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Field changes */}
                    {formatFieldChange(entry)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No change history available</p>
            <p className="text-sm">Changes will appear here as the inspection is modified</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QAChangeHistoryEnhanced;