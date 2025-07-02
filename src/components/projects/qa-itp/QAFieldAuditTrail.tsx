import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { format } from 'date-fns';
import { History, User, Clock } from 'lucide-react';

interface QAFieldAuditTrailProps {
  inspectionId: string;
  fieldName?: string;
  className?: string;
}

const QAFieldAuditTrail: React.FC<QAFieldAuditTrailProps> = ({
  inspectionId,
  fieldName,
  className = ""
}) => {
  const { changeHistory, loading } = useQAChangeHistory(inspectionId);

  // Filter changes for specific field if provided
  const filteredHistory = fieldName 
    ? changeHistory.filter(entry => entry.field_name === fieldName)
    : changeHistory;

  if (loading) {
    return (
      <div className={`p-2 border rounded-md bg-muted/30 ${className}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3 animate-spin" />
          <span>Loading changes...</span>
        </div>
      </div>
    );
  }

  if (filteredHistory.length === 0) {
    return (
      <div className={`p-2 border rounded-md bg-muted/30 ${className}`}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <History className="h-3 w-3" />
          <span>No changes recorded</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md bg-card ${className}`}>
      <div className="p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <History className="h-3 w-3" />
          <span className="text-xs font-medium">
            {fieldName ? `${fieldName} Changes` : 'Field Changes'} ({filteredHistory.length})
          </span>
        </div>
      </div>
      
      <ScrollArea className="max-h-48">
        <div className="p-2 space-y-2">
          {filteredHistory.slice(0, 10).map((entry) => (
            <div key={entry.id} className="text-xs border-l-2 border-muted pl-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="font-medium">{entry.user_name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {entry.change_type}
                </Badge>
              </div>
              
              <div className="text-muted-foreground">
                {format(new Date(entry.change_timestamp), 'dd/MM/yyyy HH:mm')}
              </div>
              
              {entry.old_value && entry.new_value && (
                <div className="space-y-1">
                  <div className="text-red-600">
                    <span className="font-medium">From:</span> {entry.old_value}
                  </div>
                  <div className="text-green-600">
                    <span className="font-medium">To:</span> {entry.new_value}
                  </div>
                </div>
              )}
              
              {entry.item_description && (
                <div className="text-muted-foreground">
                  <span className="font-medium">Item:</span> {entry.item_description}
                </div>
              )}
            </div>
          ))}
          
          {filteredHistory.length > 10 && (
            <div className="text-xs text-muted-foreground text-center pt-1">
              Showing 10 of {filteredHistory.length} changes
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default QAFieldAuditTrail;