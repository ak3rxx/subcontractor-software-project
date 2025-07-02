import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQAChangeHistory } from '@/hooks/useQAChangeHistory';
import { format } from 'date-fns';
import { History, User, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QAFieldAuditTrailLiveProps {
  inspectionId: string;
  fieldName?: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const QAFieldAuditTrailLive: React.FC<QAFieldAuditTrailLiveProps> = ({
  inspectionId,
  fieldName,
  className = "",
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const { changeHistory, loading, refetch } = useQAChangeHistory(inspectionId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(async () => {
      setIsRefreshing(true);
      await refetch();
      setIsRefreshing(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Filter changes for specific field if provided
  const filteredHistory = fieldName 
    ? changeHistory.filter(entry => entry.field_name === fieldName || entry.item_id === fieldName)
    : changeHistory;

  if (loading && filteredHistory.length === 0) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="h-3 w-3" />
            <span>No changes recorded</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            className="h-6 w-6 p-0"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-md bg-card ${className}`}>
      <div className="p-2 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-3 w-3" />
            <span className="text-xs font-medium">
              {fieldName ? `Changes` : 'Field Changes'} ({filteredHistory.length})
            </span>
            {autoRefresh && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                Live
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            className="h-6 w-6 p-0"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="max-h-48">
        <div className="p-2 space-y-2">
          {filteredHistory.slice(0, 10).map((entry) => (
            <div key={entry.id} className="text-xs border-l-2 border-primary/20 pl-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span className="font-medium">{entry.user_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-xs h-4 px-1">
                    {entry.change_type}
                  </Badge>
                  {entry.field_name === 'status' && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs h-4 px-1 ${
                        entry.new_value === 'pass' ? 'bg-green-100 text-green-800' :
                        entry.new_value === 'fail' ? 'bg-red-100 text-red-800' :
                        entry.new_value === 'na' ? 'bg-gray-100 text-gray-800' : ''
                      }`}
                    >
                      {entry.new_value?.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="text-muted-foreground">
                {format(new Date(entry.change_timestamp), 'dd/MM/yyyy HH:mm:ss')}
              </div>
              
              {entry.old_value && entry.new_value && entry.field_name !== 'evidenceFiles' && (
                <div className="space-y-1">
                  <div className="text-red-600">
                    <span className="font-medium">From:</span> {entry.old_value}
                  </div>
                  <div className="text-green-600">
                    <span className="font-medium">To:</span> {entry.new_value}
                  </div>
                </div>
              )}
              
              {entry.field_name === 'evidenceFiles' && (
                <div className="text-blue-600">
                  <span className="font-medium">Files:</span> Updated evidence files
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

export default QAFieldAuditTrailLive;