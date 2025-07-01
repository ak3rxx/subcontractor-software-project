
import { useEffect } from 'react';
import { useAuditTrailFetch } from './useAuditTrailFetch';
import { useAuditTrailRefresh } from './useAuditTrailRefresh';
import { useEmailLogging } from './useEmailLogging';

export const useVariationAuditTrail = (variationId?: string) => {
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
      // Immediate refresh after logging
      await immediateRefresh();
    }
    return success;
  };

  // Fetch audit trail when variationId changes
  useEffect(() => {
    if (variationId) {
      console.log('useEffect triggered for variationId:', variationId);
      resetFetchState(); // Reset to allow fresh fetch
      fetchAuditTrail(variationId, false, false);
    }
  }, [variationId, fetchAuditTrail, resetFetchState]);

  // Cleanup function
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
    logEmailSent // Only keep email logging, everything else is handled by DB trigger
  };
};

// Re-export types for convenience
export type { AuditTrailEntry } from '@/types/auditTrail';
