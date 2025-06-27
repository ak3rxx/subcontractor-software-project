
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
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
  const { auditTrail, loading: auditLoading, refetch: refetchAudit } = useVariationAuditTrail(variation?.id);

  // Fetch audit trail when variation changes
  useEffect(() => {
    if (variation?.id && !auditLoading) {
      refetchAudit();
    }
  }, [variation?.id, refetchAudit]);

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

  const canShowApprovalTab = () => {
    // Show approval tab if variation is not in draft or if user can edit
    return variation.status !== 'draft' || canEditVariation;
  };

  const handleStatusChange = () => {
    // Refresh audit trail after status change
    setTimeout(() => {
      refetchAudit();
    }, 500);
    
    // Call parent callback if provided
    if (onStatusChange) {
      onStatusChange();
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-6 pr-4">
        {/* Current Status */}
        <VariationStatusInfo variation={variation} />

        {/* Approval Actions */}
        <VariationApprovalActions
          variation={variation}
          onUpdate={onUpdate}
          onStatusChange={handleStatusChange}
          isBlocked={isBlocked}
        />

        {/* Approval History */}
        <VariationApprovalHistory
          auditTrail={auditTrail}
          loading={auditLoading}
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
      </div>
    </ScrollArea>
  );
};

export default EnhancedVariationApprovalTab;
