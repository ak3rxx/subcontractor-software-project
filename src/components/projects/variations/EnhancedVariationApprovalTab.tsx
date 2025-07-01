
import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useVariationAuditTrail } from '@/hooks/useVariationAuditTrail';
import VariationApprovalActions from './VariationApprovalActions';
import VariationStatusInfo from './VariationStatusInfo';
import VariationApprovalHistory from './VariationApprovalHistory';

interface EnhancedVariationApprovalTabProps {
  variation: any;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onStatusChange?: () => void;
  isBlocked: boolean;
}

const EnhancedVariationApprovalTab: React.FC<EnhancedVariationApprovalTabProps> = ({
  variation,
  onUpdate,
  onStatusChange,
  isBlocked
}) => {
  const { user } = useAuth();
  const { isDeveloper, canEdit, canAdmin } = usePermissions();
  const { 
    auditTrail, 
    loading: auditLoading, 
    refreshing,
    error: auditError,
    refetch,
    debouncedRefresh
  } = useVariationAuditTrail(variation?.id);

  const [refreshCount, setRefreshCount] = useState(0);
  const lastUpdateTimestampRef = useRef<string>('');
  const statusChangeInProgressRef = useRef(false);

  // Enhanced permission checks
  const userRole = user?.role || 'user';
  const userEmail = user?.email || '';
  const isFullAccessUser = userEmail === 'huy.nguyen@dcsquared.com.au';
  const isProjectManager = userRole === 'project_manager';

  // Optimized status change handler - prevents cascading refreshes
  const handleStatusChange = async () => {
    if (statusChangeInProgressRef.current) {
      console.log('Status change already in progress, skipping...');
      return;
    }

    statusChangeInProgressRef.current = true;
    console.log('Status change detected, triggering controlled refresh');
    
    try {
      setRefreshCount(prev => prev + 1);
      
      // Only refresh audit trail after a brief delay to let DB triggers complete
      setTimeout(async () => {
        try {
          await refetch();
          if (onStatusChange) {
            onStatusChange();
          }
        } catch (error) {
          console.error('Error in delayed status change handling:', error);
        } finally {
          statusChangeInProgressRef.current = false;
        }
      }, 1000);
      
      console.log('Status change handling initiated successfully');
    } catch (error) {
      console.error('Error in status change handling:', error);
      statusChangeInProgressRef.current = false;
    }
  };

  // Controlled effect for variation updates - only refresh when truly necessary
  useEffect(() => {
    if (!variation?.id || !variation?.updated_at) return;

    const currentTimestamp = variation.updated_at;
    
    // Only refresh if the timestamp actually changed and we're not in a status change
    if (currentTimestamp !== lastUpdateTimestampRef.current && !statusChangeInProgressRef.current) {
      console.log('Variation timestamp changed, scheduling refresh:', {
        id: variation.id,
        status: variation.status,
        old_timestamp: lastUpdateTimestampRef.current,
        new_timestamp: currentTimestamp
      });
      
      lastUpdateTimestampRef.current = currentTimestamp;
      
      // Use debounced refresh to prevent rapid successive calls
      debouncedRefresh(1500, false);
    }
  }, [variation?.id, variation?.updated_at, variation?.status, debouncedRefresh]);

  // Enhanced status indicator with better error handling
  const getStatusIndicator = () => {
    if (refreshing) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Clock className="h-4 w-4 animate-spin" />
          <span className="text-sm">Refreshing...</span>
        </div>
      );
    }
    
    if (auditError) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Error loading history</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Up to date</span>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-6 pr-4">
        {/* Status Indicator */}
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Approval Status:</span>
                {getStatusIndicator()}
              </div>
              {refreshCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  Refreshed {refreshCount} times
                </Badge>
              )}
            </div>
            {lastUpdateTimestampRef.current && (
              <div className="text-xs text-gray-500 mt-1">
                Last update: {new Date(lastUpdateTimestampRef.current).toLocaleTimeString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Status */}
        <VariationStatusInfo variation={variation} />

        {/* Approval Actions */}
        <VariationApprovalActions
          variation={variation}
          onUpdate={onUpdate}
          onStatusChange={handleStatusChange}
          isBlocked={isBlocked}
        />

        {/* Error Display */}
        {auditError && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error loading approval history</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{auditError}</p>
            </CardContent>
          </Card>
        )}

        {/* Approval History */}
        <VariationApprovalHistory
          auditTrail={auditTrail}
          loading={auditLoading || refreshing}
        />

        {/* Permission Info */}
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <h4 className="font-medium mb-2 text-blue-900">Your Permissions</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>• Role: {userRole}</div>
              {(isDeveloper() || canEdit('variations') || isProjectManager) && <div>• Can submit variations for approval</div>}
              {(isDeveloper() || canAdmin('variations') || canEdit('variations') || isProjectManager) && <div>• Can approve/reject variations</div>}
              {(isDeveloper() || canAdmin('variations') || isProjectManager) && <div>• Can unlock and revert approved/rejected variations</div>}
              {isProjectManager && <div>• Project Manager override permissions enabled</div>}
            </div>
          </CardContent>
        </Card>

        {/* Debug Info (only for developers) */}
        {isDeveloper() && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2 text-yellow-800">Debug Info</h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>Variation ID: {variation?.id}</div>
                <div>Status: {variation?.status}</div>
                <div>Updated: {variation?.updated_at}</div>
                <div>Audit Entries: {auditTrail.length}</div>
                <div>Loading: {auditLoading ? 'Yes' : 'No'}</div>
                <div>Refreshing: {refreshing ? 'Yes' : 'No'}</div>
                <div>Error: {auditError || 'None'}</div>
                <div>Status Change in Progress: {statusChangeInProgressRef.current ? 'Yes' : 'No'}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default EnhancedVariationApprovalTab;
