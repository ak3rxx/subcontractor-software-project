
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AuditTrailEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: 'create' | 'edit' | 'submit' | 'approve' | 'reject' | 'unlock' | 'email_sent';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  status_from?: string;
  status_to?: string;
  comments?: string;
  metadata: any;
  action_timestamp: string;
}

// Database response interface
interface DatabaseAuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  status_from?: string;
  status_to?: string;
  comments?: string;
  metadata: any;
  action_timestamp: string;
}

// Helper function to validate and transform database response
const transformAuditEntry = (dbEntry: DatabaseAuditEntry): AuditTrailEntry => {
  const validActionTypes = ['create', 'edit', 'submit', 'approve', 'reject', 'unlock', 'email_sent'];
  const actionType = validActionTypes.includes(dbEntry.action_type) 
    ? dbEntry.action_type as AuditTrailEntry['action_type']
    : 'edit'; // fallback to 'edit' for invalid types

  return {
    id: dbEntry.id,
    user_id: dbEntry.user_id,
    user_name: dbEntry.user_name,
    action_type: actionType,
    field_name: dbEntry.field_name,
    old_value: dbEntry.old_value,
    new_value: dbEntry.new_value,
    status_from: dbEntry.status_from,
    status_to: dbEntry.status_to,
    comments: dbEntry.comments,
    metadata: dbEntry.metadata,
    action_timestamp: dbEntry.action_timestamp
  };
};

export const useVariationAuditTrail = (variationId?: string) => {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Refs for debouncing and preventing duplicate requests
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const lastFetchIdRef = useRef<string | null>(null);

  const fetchAuditTrail = useCallback(async (forceRefresh = false, showRefreshingState = false) => {
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
  }, [variationId]);

  // Debounced refresh function to prevent excessive API calls
  const debouncedRefresh = useCallback((delay = 500, showRefreshingState = true) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      console.log('Debounced audit trail refresh triggered');
      fetchAuditTrail(true, showRefreshingState);
    }, delay);
  }, [fetchAuditTrail]);

  // Immediate refresh function for critical updates
  const immediateRefresh = useCallback(async () => {
    console.log('Immediate audit trail refresh triggered');
    await fetchAuditTrail(true, true);
  }, [fetchAuditTrail]);

  const logAuditEntry = async (
    actionType: AuditTrailEntry['action_type'],
    options: {
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      statusFrom?: string;
      statusTo?: string;
      comments?: string;
      metadata?: any;
    } = {}
  ) => {
    if (!variationId || !user) {
      console.warn('Cannot log audit entry: missing variationId or user');
      return false;
    }

    try {
      console.log('Logging audit entry:', {
        variationId,
        userId: user.id,
        actionType,
        options
      });

      const { data, error } = await supabase
        .rpc('log_variation_change', {
          p_variation_id: variationId,
          p_user_id: user.id,
          p_action_type: actionType,
          p_field_name: options.fieldName,
          p_old_value: options.oldValue,
          p_new_value: options.newValue,
          p_status_from: options.statusFrom,
          p_status_to: options.statusTo,
          p_comments: options.comments,
          p_metadata: options.metadata || {}
        });

      if (error) {
        console.error('Error logging audit entry:', error);
        setError(`Failed to log audit entry: ${error.message}`);
        return false;
      }

      console.log('Audit entry logged successfully:', data);
      
      // Immediate refresh after logging to ensure UI is up to date
      await immediateRefresh();
      
      return true;
    } catch (error) {
      console.error('Error logging audit entry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to log audit entry';
      setError(errorMessage);
      return false;
    }
  };

  // Enhanced batch logging for multiple changes
  const logBatchAuditEntries = async (entries: Array<{
    actionType: AuditTrailEntry['action_type'];
    options: {
      fieldName?: string;
      oldValue?: string;
      newValue?: string;
      statusFrom?: string;
      statusTo?: string;
      comments?: string;
      metadata?: any;
    };
  }>) => {
    if (!variationId || !user || entries.length === 0) {
      console.warn('Cannot log batch audit entries: missing variationId, user, or entries');
      return false;
    }

    try {
      console.log('Logging batch audit entries:', entries.length);
      
      // Log all entries
      const results = await Promise.all(
        entries.map(({ actionType, options }) =>
          supabase.rpc('log_variation_change', {
            p_variation_id: variationId,
            p_user_id: user.id,
            p_action_type: actionType,
            p_field_name: options.fieldName,
            p_old_value: options.oldValue,
            p_new_value: options.newValue,
            p_status_from: options.statusFrom,
            p_status_to: options.statusTo,
            p_comments: options.comments,
            p_metadata: options.metadata || {}
          })
        )
      );

      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors in batch logging:', errors);
        setError(`Failed to log ${errors.length} audit entries`);
        return false;
      }

      console.log('Batch audit entries logged successfully');
      
      // Single refresh after all entries are logged
      await immediateRefresh();
      
      return true;
    } catch (error) {
      console.error('Error logging batch audit entries:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to log batch audit entries';
      setError(errorMessage);
      return false;
    }
  };

  // Fetch audit trail when variationId changes
  useEffect(() => {
    if (variationId) {
      console.log('useEffect triggered for variationId:', variationId);
      lastFetchIdRef.current = null; // Reset to allow fresh fetch
      fetchAuditTrail(false, false);
    } else {
      setAuditTrail([]);
      setError(null);
    }
  }, [variationId, fetchAuditTrail]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      isRefreshingRef.current = false;
    };
  }, []);

  return {
    auditTrail,
    loading,
    refreshing,
    error,
    fetchAuditTrail,
    logAuditEntry,
    logBatchAuditEntries,
    refetch: immediateRefresh,
    debouncedRefresh
  };
};
