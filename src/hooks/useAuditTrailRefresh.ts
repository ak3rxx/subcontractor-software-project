
import { useCallback, useRef } from 'react';

export const useAuditTrailRefresh = (fetchFunction: (forceRefresh: boolean, showRefreshingState: boolean) => Promise<void>) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced refresh function to prevent excessive API calls
  const debouncedRefresh = useCallback((delay = 500, showRefreshingState = true) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      console.log('Debounced audit trail refresh triggered');
      fetchFunction(true, showRefreshingState);
    }, delay);
  }, [fetchFunction]);

  // Immediate refresh function for critical updates
  const immediateRefresh = useCallback(async () => {
    console.log('Immediate audit trail refresh triggered');
    await fetchFunction(true, true);
  }, [fetchFunction]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  return {
    debouncedRefresh,
    immediateRefresh,
    cleanup
  };
};
