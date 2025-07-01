
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditTrailEntry, DatabaseAuditEntry } from '@/types/auditTrail';
import { transformAuditEntry } from '@/utils/auditTrailTransform';

export const useAuditTrailFetch = () => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for debouncing and preventing duplicate requests
  const isRefreshingRef = useRef(false);
  const lastFetchIdRef = useRef<string | null>(null);

  const fetchAuditTrail = useCallback(async (
    variationId: string, 
    forceRefresh = false, 
    showRefreshingState = false
  ) => {
    if (!variationId) {
      setAuditTrail([]);
      setError(null);
      return;
    }

    // Prevent duplicate requests
    if (isRefreshingRef.current && !forceRefresh) {
      console.log('Audit trail fetch already in progress, skipping...');
      return;
    }

    // Skip if this is the same variation and we just fetched it
    if (!forceRefresh && lastFetchIdRef.current === variationId) {
      console.log('Audit trail already fetched for this variation, skipping...');
      return;
    }

    isRefreshingRef.current = true;
    lastFetchIdRef.current = variationId;
    
    if (showRefreshingState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log('Fetching audit trail for variation:', variationId);
      
      const { data, error } = await supabase
        .rpc('get_variation_audit_history', { p_variation_id: variationId });

      if (error) {
        console.error('Error fetching audit trail:', error);
        setError(error.message || 'Failed to load audit trail');
        setAuditTrail([]);
        return;
      }

      console.log('Raw audit trail data:', data);

      // Transform the database response to match our TypeScript interface
      const transformedData = (data || []).map((entry: DatabaseAuditEntry) => 
        transformAuditEntry(entry)
      );
      
      console.log('Transformed audit trail data:', transformedData);
      setAuditTrail(transformedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audit trail';
      setError(errorMessage);
      setAuditTrail([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, []);

  const resetFetchState = useCallback(() => {
    lastFetchIdRef.current = null;
  }, []);

  return {
    auditTrail,
    loading,
    refreshing,
    error,
    fetchAuditTrail,
    resetFetchState
  };
};
