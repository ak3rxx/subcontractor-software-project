
import { useEffect, useRef } from 'react';
import { useAuditTrailFetch } from './useAuditTrailFetch';
import { useAuditTrailRefresh } from './useAuditTrailRefresh';
import { useEmailLogging } from './useEmailLogging';

export const useVariationAuditTrail = (variationId?: string, variation?: any) => {
  const lastVariationIdRef = useRef<string | null>(null);
  const lastStatusRef = useRef<string | null>(null);
  const lastUpdatedAtRef = useRef<string | null>(null);
  
  const {
    auditTrail,
    loading,
    refreshing,
    error,
    fetchAuditTrail,
    resetFetchState
  } = useAuditTrailFetch();

  const fetchWithVariationId = (forceRefresh = false, showRefreshingState = false) => {
    if (variationId) {
      return fetchAuditTrail(variationId, forceRefresh, showRefreshingState);
    }
    return Promise.resolve();
  };

  const {
    debouncedRefresh,
    immediateRefresh,
    cleanup
  } = useAuditTrailRefresh(fetchWithVariationId);

  const { logEmailSent: logEmail } = useEmailLogging();

  const logEmailSent = async (comments?: string) => {
    if (!variationId) return false;
    
    const success = await logEmail(variationId, comments);
    if (success) {
      // Use debounced refresh after logging to prevent loops
      debouncedRefresh(500, true);
    }
    return success;
  };

  // Initial fetch when variationId changes
  useEffect(() => {
    if (variationId && variationId !== lastVariationIdRef.current) {
      console.log('New variation ID, fetching audit trail:', variationId);
      lastVariationIdRef.current = variationId;
      resetFetchState();
      fetchAuditTrail(variationId, false, false);
    }
  }, [variationId, fetchAuditTrail, resetFetchState]);

  // Refresh audit trail when variation data changes (status, updated_at, etc.)
  useEffect(() => {
    if (variation && variationId) {
      const currentStatus = variation.status;
      const currentUpdatedAt = variation.updated_at;
      
      // Check if status or updated_at has changed
      if (
        (currentStatus !== lastStatusRef.current) ||
        (currentUpdatedAt !== lastUpdatedAtRef.current)
      ) {
        console.log('Variation data changed, refreshing audit trail');
        lastStatusRef.current = currentStatus;
        lastUpdatedAtRef.current = currentUpdatedAt;
        
        // Use debounced refresh for all changes to prevent loops
        debouncedRefresh(500, true);
      }
    }
  }, [variation, variationId, immediateRefresh, debouncedRefresh]);

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
    debouncedRefresh,
    logEmailSent
  };
};

// Re-export types for convenience
export type { AuditTrailEntry } from '@/types/auditTrail';
