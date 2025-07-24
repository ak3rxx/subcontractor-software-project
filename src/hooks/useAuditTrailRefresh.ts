
import { useCallback, useRef } from 'react';

export const useAuditTrailRefresh = (fetchFunction: (forceRefresh: boolean, showRefreshingState: boolean) => Promise<void>) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Enhanced debounced refresh with immediate execution for real-time updates
  const debouncedRefresh = useCallback((delay = 300, showRefreshingState = true) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // For audit trail updates, use shorter delay for more responsive updates
    const actualDelay = delay < 500 ? 200 : delay;
    
    debounceTimerRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) {
        console.log('Refresh started elsewhere, queuing another refresh');
        // Queue another refresh after current one completes
        setTimeout(() => debouncedRefresh(actualDelay, showRefreshingState), 100);
        return;
      }

      isRefreshingRef.current = true;
      try {
        console.log('Executing debounced audit trail refresh');
        await fetchFunction(true, showRefreshingState);
      } catch (error) {
        console.error('Error in debounced refresh:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    }, actualDelay);
  }, [fetchFunction]);

  // Immediate refresh function with concurrency protection
  const immediateRefresh = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress, skipping immediate refresh');
      return;
    }

    isRefreshingRef.current = true;
    try {
      console.log('Executing immediate audit trail refresh');
      await fetchFunction(true, true);
    } catch (error) {
      console.error('Error in immediate refresh:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchFunction]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    isRefreshingRef.current = false;
  }, []);

  return {
    debouncedRefresh,
    immediateRefresh,
    cleanup
  };
};
