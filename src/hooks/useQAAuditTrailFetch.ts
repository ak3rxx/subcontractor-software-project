import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QAAuditTrailEntry {
  id: string;
  change_timestamp: string;
  user_id: string;
  user_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'create' | 'update' | 'delete';
  item_id?: string;
  item_description?: string;
}

export const useQAAuditTrailFetch = () => {
  const [auditTrail, setAuditTrail] = useState<QAAuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced refs for better concurrency control
  const fetchInProgressRef = useRef(false);
  const lastFetchIdRef = useRef<string | null>(null);
  const lastFetchTimestampRef = useRef<number>(0);

  const fetchAuditTrail = useCallback(async (
    inspectionId: string, 
    forceRefresh = false, 
    showRefreshingState = false
  ) => {
    if (!inspectionId) {
      setAuditTrail([]);
      setError(null);
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimestampRef.current;

    // Enhanced duplicate request prevention
    if (fetchInProgressRef.current) {
      console.log('QA audit trail fetch already in progress, skipping...');
      return;
    }

    // Skip if this is the same inspection and we just fetched it recently (within 2 seconds)
    if (!forceRefresh && 
        lastFetchIdRef.current === inspectionId && 
        timeSinceLastFetch < 2000) {
      console.log('Recent QA audit trail fetch for same inspection, skipping...', { timeSinceLastFetch });
      return;
    }

    fetchInProgressRef.current = true;
    lastFetchIdRef.current = inspectionId;
    lastFetchTimestampRef.current = now;
    
    if (showRefreshingState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setError(null);

    try {
      console.log('Fetching QA audit trail for inspection:', inspectionId);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_qa_change_history', { p_inspection_id: inspectionId });

      if (fetchError) {
        console.error('Error fetching QA audit trail:', fetchError);
        setError(fetchError.message || 'Failed to load change history');
        setAuditTrail([]);
        return;
      }

      console.log('Raw QA audit trail data:', data);

      // Transform the database response to match our TypeScript interface
      const transformedData = (data || []).map((entry: any) => ({
        id: entry.id,
        change_timestamp: entry.change_timestamp,
        user_id: entry.user_id,
        user_name: entry.user_name || 'Unknown User',
        field_name: entry.field_name,
        old_value: entry.old_value,
        new_value: entry.new_value,
        change_type: entry.change_type,
        item_id: entry.item_id,
        item_description: entry.item_description
      }));
      
      console.log('Transformed QA audit trail data:', transformedData);
      setAuditTrail(transformedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching QA audit trail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load change history';
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