
import { useCallback, useRef } from 'react';

export const useAuditTrailRefresh = (fetchFunction: (forceRefresh: boolean, showRefreshingState: boolean) => Promise<void>) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Enhanced debounced refresh function with better state management
  const debouncedRefresh = useCallback((delay = 1000, showRefreshingState = false) => {
    // Prevent multiple concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress, skipping debounced refresh');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      if (isRefreshingRef.current) {
        console.log('Refresh started elsewhere, skipping debounced execution');
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
    }, delay);
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
