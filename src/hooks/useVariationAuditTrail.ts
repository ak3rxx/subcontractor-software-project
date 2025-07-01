
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  // Simplified function for email logging only (database trigger handles everything else)
  const logEmailSent = async (comments?: string) => {
    if (!variationId || !user) {
      console.warn('Cannot log email: missing variationId or user');
      return false;
    }

    try {
      console.log('Logging email sent for variation:', variationId);

      const { data, error } = await supabase
        .rpc('log_variation_change', {
          p_variation_id: variationId,
          p_user_id: user.id,
          p_action_type: 'email_sent',
          p_comments: comments || 'Variation email sent'
        });

      if (error) {
        console.error('Error logging email:', error);
        return false;
      }

      console.log('Email logged successfully:', data);
      
      // Immediate refresh after logging
      await immediateRefresh();
      
      return true;
    } catch (error) {
      console.error('Error logging email:', error);
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
    refetch: immediateRefresh,
    debouncedRefresh,
    logEmailSent // Only keep email logging, everything else is handled by DB trigger
  };
};
