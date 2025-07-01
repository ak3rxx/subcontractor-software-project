
import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: {
    loading: boolean;
    error: string | null;
    lastOperation: string | null;
    timestamp: number;
  };
}

export const useLoadingStateManager = () => {
  const [states, setStates] = useState<LoadingState>({});
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Set loading state
  const setLoading = useCallback((key: string, operation: string, loading = true) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        loading,
        error: loading ? null : prev[key]?.error || null, // Clear error when starting new operation
        lastOperation: operation,
        timestamp: Date.now()
      }
    }));
  }, []);

  // Set error state with auto-clear
  const setError = useCallback((key: string, error: string | null, autoClearMs?: number) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        loading: false,
        error,
        lastOperation: prev[key]?.lastOperation || null,
        timestamp: Date.now()
      }
    }));

    // Auto-clear error after specified time
    if (error && autoClearMs) {
      const existingTimeout = timeouts.current.get(`${key}-error`);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        setStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            error: null
          }
        }));
        timeouts.current.delete(`${key}-error`);
      }, autoClearMs);

      timeouts.current.set(`${key}-error`, timeout);
    }
  }, []);

  // Clear specific state
  const clearState = useCallback((key: string) => {
    setStates(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });

    // Clear any associated timeouts
    const errorTimeout = timeouts.current.get(`${key}-error`);
    if (errorTimeout) {
      clearTimeout(errorTimeout);
      timeouts.current.delete(`${key}-error`);
    }
  }, []);

  // Get state
  const getState = useCallback((key: string) => {
    return states[key] || {
      loading: false,
      error: null,
      lastOperation: null,
      timestamp: 0
    };
  }, [states]);

  // Check if any operations are loading
  const isAnyLoading = useCallback((keys?: string[]) => {
    const keysToCheck = keys || Object.keys(states);
    return keysToCheck.some(key => states[key]?.loading);
  }, [states]);

  // Get all errors
  const getAllErrors = useCallback((keys?: string[]) => {
    const keysToCheck = keys || Object.keys(states);
    return keysToCheck
      .map(key => ({ key, error: states[key]?.error }))
      .filter(item => item.error);
  }, [states]);

  // Async operation wrapper with automatic state management
  const executeWithLoading = useCallback(async <T>(
    key: string,
    operation: string,
    asyncFn: () => Promise<T>,
    options?: {
      errorAutoClearMs?: number;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    }
  ): Promise<T | null> => {
    setLoading(key, operation, true);

    try {
      const result = await asyncFn();
      setLoading(key, operation, false);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(key, errorMessage, options?.errorAutoClearMs);
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, [setLoading, setError]);

  // Cleanup all timeouts
  const cleanup = useCallback(() => {
    timeouts.current.forEach(timeout => clearTimeout(timeout));
    timeouts.current.clear();
  }, []);

  return {
    setLoading,
    setError,
    clearState,
    getState,
    isAnyLoading,
    getAllErrors,
    executeWithLoading,
    cleanup,
    states
  };
};
