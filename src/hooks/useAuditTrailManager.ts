
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuditTrailEntry, DatabaseAuditEntry } from '@/types/auditTrail';
import { transformAuditEntry } from '@/utils/auditTrailTransform';

interface AuditCache {
  [variationId: string]: {
    data: AuditTrailEntry[];
    timestamp: number;
    loading: boolean;
  };
}

export const useAuditTrailManager = () => {
  const [cache, setCache] = useState<AuditCache>({});
  const [error, setError] = useState<string | null>(null);
  const pendingRequests = useRef<Set<string>>(new Set());
  const refreshTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Smart fetch with aggressive caching and deduplication
  const fetchAuditTrail = useCallback(async (
    variationId: string, 
    forceRefresh = false,
    showLoading = true
  ) => {
    if (!variationId) return [];

    // Check cache first (2 minute cache for audit trail)
    const cacheEntry = cache[variationId];
    const now = Date.now();
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

    if (!forceRefresh && cacheEntry && !cacheEntry.loading && (now - cacheEntry.timestamp) < CACHE_DURATION) {
      return cacheEntry.data;
    }

    // Prevent duplicate requests
    if (pendingRequests.current.has(variationId)) {
      return cacheEntry?.data || [];
    }

    pendingRequests.current.add(variationId);

    // Set loading state
    if (showLoading) {
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: prev[variationId]?.data || [],
          timestamp: prev[variationId]?.timestamp || 0,
          loading: true
        }
      }));
    }

    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_variation_audit_history', { p_variation_id: variationId });

      if (fetchError) {
        console.error('Error fetching audit trail:', fetchError);
        throw fetchError;
      }

      const transformedData = (data || []).map((entry: DatabaseAuditEntry) => 
        transformAuditEntry(entry)
      );

      // Update cache
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: transformedData,
          timestamp: now,
          loading: false
        }
      }));

      return transformedData;
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audit trail';
      setError(errorMessage);
      
      // Reset loading state on error
      setCache(prev => ({
        ...prev,
        [variationId]: {
          data: prev[variationId]?.data || [],
          timestamp: prev[variationId]?.timestamp || 0,
          loading: false
        }
      }));

      return [];
    } finally {
      pendingRequests.current.delete(variationId);
    }
  }, [cache]);

  // Debounced refresh to prevent excessive API calls
  const debouncedRefresh = useCallback((variationId: string, delay = 1000) => {
    // Clear existing timeout
    const existingTimeout = refreshTimeouts.current.get(variationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      fetchAuditTrail(variationId, true, false);
      refreshTimeouts.current.delete(variationId);
    }, delay);

    refreshTimeouts.current.set(variationId, timeout);
  }, [fetchAuditTrail]);

  // Immediate refresh
  const immediateRefresh = useCallback(async (variationId: string) => {
    // Cancel any pending debounced refresh
    const existingTimeout = refreshTimeouts.current.get(variationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      refreshTimeouts.current.delete(variationId);
    }

    return await fetchAuditTrail(variationId, true, true);
  }, [fetchAuditTrail]);

  // Log email with cache invalidation
  const logEmailSent = useCallback(async (variationId: string, comments?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('variation_audit_trail')
        .insert({
          variation_id: variationId,
          action_type: 'email_sent',
          comments: comments || 'Variation email sent to client',
          metadata: { email_action: 'sent_to_client' },
          user_id: user.id
        });

      if (error) {
        console.error('Error logging email:', error);
        return false;
      }

      // Invalidate cache and refresh
      debouncedRefresh(variationId, 500);
      return true;
    } catch (error) {
      console.error('Error logging email:', error);
      return false;
    }
  }, [debouncedRefresh]);

  // Get cached data
  const getAuditTrail = useCallback((variationId: string) => {
    const cacheEntry = cache[variationId];
    return {
      auditTrail: cacheEntry?.data || [],
      loading: cacheEntry?.loading || false,
      lastFetched: cacheEntry?.timestamp || 0,
      error
    };
  }, [cache, error]);

  // Invalidate cache
  const invalidateCache = useCallback((variationId: string) => {
    setCache(prev => {
      const { [variationId]: removed, ...rest } = prev;
      return rest;
    });
    
    // Clear any pending timeouts
    const timeout = refreshTimeouts.current.get(variationId);
    if (timeout) {
      clearTimeout(timeout);
      refreshTimeouts.current.delete(variationId);
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    refreshTimeouts.current.forEach(timeout => clearTimeout(timeout));
    refreshTimeouts.current.clear();
    
    // Clear pending requests
    pendingRequests.current.clear();
  }, []);

  return {
    fetchAuditTrail,
    debouncedRefresh,
    immediateRefresh,
    logEmailSent,
    getAuditTrail,
    invalidateCache,
    cleanup,
    cache
  };
};
