
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditTrailEntry, DatabaseAuditEntry } from '@/types/auditTrail';
import { transformAuditEntry } from '@/utils/auditTrailTransform';

export const useAuditTrailFetch = () => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced refs for better concurrency control
  const fetchInProgressRef = useRef(false);
  const lastFetchIdRef = useRef<string | null>(null);
  const lastFetchTimestampRef = useRef<number>(0);

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

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimestampRef.current;

    // Enhanced duplicate request prevention
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    // Skip if this is the same variation and we just fetched it recently (within 2 seconds)
    if (!forceRefresh && 
        lastFetchIdRef.current === variationId && 
        timeSinceLastFetch < 2000) {
      console.log('Recent fetch for same variation, skipping...', { timeSinceLastFetch });
      return;
    }

    fetchInProgressRef.current = true;
    lastFetchIdRef.current = variationId;
    lastFetchTimestampRef.current = now;
    
    if (showRefreshingState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log('Fetching audit trail for variation:', variationId);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_variation_audit_history', { p_variation_id: variationId });

      if (fetchError) {
        console.error('Error fetching audit trail:', fetchError);
        setError(fetchError.message || 'Failed to load audit trail');
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
      fetchInProgressRef.current = false;
    }
  }, []);

  const resetFetchState = useCallback(() => {
    lastFetchIdRef.current = null;
    lastFetchTimestampRef.current = 0;
    fetchInProgressRef.current = false;
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
