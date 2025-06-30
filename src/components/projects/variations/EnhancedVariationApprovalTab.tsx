
import React, { useState, useEffect } from 'react';
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
  const [lastVariationUpdate, setLastVariationUpdate] = useState<string>('');

  // Enhanced permission checks
  const userRole = user?.role || 'user';
  const userEmail = user?.email || '';
  const isFullAccessUser = userEmail === 'huy.nguyen@dcsquared.com.au';
  const isProjectManager = userRole === 'project_manager';
  const canEditVariation = [
    'project_manager', 
    'contract_administrator', 
    'project_engineer',
    'admin',
    'manager'
  ].includes(userRole) || isFullAccessUser || isDeveloper() || canEdit('variations');

  // Enhanced status change handler with immediate feedback
  const handleStatusChange = async () => {
    console.log('Status change detected, triggering comprehensive refresh sequence');
    
    try {
      // Increment refresh counter for UI feedback
      setRefreshCount(prev => prev + 1);
      
      // Update last variation update timestamp
      setLastVariationUpdate(new Date().toISOString());
      
      // Immediate audit trail refresh
      if (variation?.id) {
        console.log('Triggering immediate audit trail refresh...');
        await refetch();
      }
      
      // Call parent callback for cross-component refresh
      if (onStatusChange) {
        console.log('Calling parent status change callback...');
        onStatusChange();
      }
      
      console.log('Status change handling completed successfully');
    } catch (error) {
      console.error('Error in status change handling:', error);
    }
  };

  // Enhanced effect to refresh audit trail when variation changes
  useEffect(() => {
    if (variation?.id && variation?.updated_at) {
      console.log('Variation updated, refreshing audit trail:', {
        id: variation.id,
        status: variation.status,
        updated_at: variation.updated_at
      });
      
      // Use debounced refresh to avoid excessive API calls
      debouncedRefresh(300, true);
    }
  }, [variation?.id, variation?.status, variation?.updated_at, debouncedRefresh]);

  // Auto-refresh audit trail periodically for active variations
  useEffect(() => {
    if (!variation?.id || variation.status === 'draft') return;
    
    const interval = setInterval(() => {
      console.log('Periodic audit trail refresh');
      debouncedRefresh(100, false);
    }, 30000); // Refresh every 30 seconds for active variations
    
    return () => clearInterval(interval);
  }, [variation?.id, variation?.status, debouncedRefresh]);

  const canShowApprovalTab = () => {
    // Show approval tab if variation is not in draft or if user can edit
    return variation.status !== 'draft' || canEditVariation;
  };

  // Enhanced status indicator
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
            {lastVariationUpdate && (
              <div className="text-xs text-gray-500 mt-1">
                Last update: {new Date(lastVariationUpdate).toLocaleTimeString()}
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
              {canEditVariation && <div>• Can submit variations for approval</div>}
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default EnhancedVariationApprovalTab;
