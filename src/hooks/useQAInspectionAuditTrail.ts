import { useEffect, useRef } from 'react';
import { useQAAuditTrailFetch } from './useQAAuditTrailFetch';
import { useQAAuditTrailRefresh } from './useQAAuditTrailRefresh';

export const useQAInspectionAuditTrail = (inspectionId?: string, inspection?: any) => {
  const lastInspectionIdRef = useRef<string | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const lastUpdatedAtRef = useRef<string | null>(null);
  
  const {
    auditTrail,
    loading,
    refreshing,
    error,
    fetchAuditTrail,
    resetFetchState
  } = useQAAuditTrailFetch();

  const fetchWithInspectionId = (forceRefresh = false, showRefreshingState = false) => {
    if (inspectionId) {
      return fetchAuditTrail(inspectionId, forceRefresh, showRefreshingState);
    }
    return Promise.resolve();
  };

  const {
    debouncedRefresh,
    immediateRefresh,
    cleanup
  } = useQAAuditTrailRefresh(fetchWithInspectionId);

  // Initial fetch when inspectionId changes
  useEffect(() => {
    if (inspectionId && inspectionId !== lastInspectionIdRef.current) {
      console.log('New QA inspection ID, fetching audit trail:', inspectionId);
      lastInspectionIdRef.current = inspectionId;
      resetFetchState();
      fetchAuditTrail(inspectionId, false, false);
    }
  }, [inspectionId, fetchAuditTrail, resetFetchState]);

  // Refresh audit trail when inspection data changes (status, updated_at, etc.)
  useEffect(() => {
    if (inspection && inspectionId) {
      const currentStatus = inspection.overall_status;
      const currentUpdatedAt = inspection.updated_at;
      
      // Check if status or updated_at has changed
      if (
        (currentStatus !== lastStatusRef.current) ||
        (currentUpdatedAt !== lastUpdatedAtRef.current)
      ) {
        console.log('QA inspection data changed, refreshing audit trail');
        lastStatusRef.current = currentStatus;
        lastUpdatedAtRef.current = currentUpdatedAt;
        
        // Use immediate refresh for status changes, debounced for other updates
        if (currentStatus !== lastStatusRef.current) {
          immediateRefresh();
        } else {
          debouncedRefresh(300, true);
        }
      }
    }
  }, [inspection, inspectionId, immediateRefresh, debouncedRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    auditTrail,
    loading,
    refreshing,
    error,
    refetch: immediateRefresh,
    debouncedRefresh
  };
};