import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseFormTimeoutOptions {
  timeoutMs?: number;
  onTimeout?: () => void;
  onProgress?: (remainingMs: number) => void;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
}

export const useFormTimeout = (options: UseFormTimeoutOptions = {}) => {
  const {
    timeoutMs = 45000, // 45 seconds default
    onTimeout,
    onProgress,
    enableAutoSave = true,
    autoSaveInterval = 10000 // Auto-save every 10 seconds
  } = options;
  
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    if (autoSaveRef.current) {
      clearInterval(autoSaveRef.current);
      autoSaveRef.current = null;
    }
    isActiveRef.current = false;
  }, []);

  const startTimeout = useCallback((autoSaveCallback?: () => void) => {
    cleanup();
    
    startTimeRef.current = Date.now();
    isActiveRef.current = true;
    
    console.log(`Form timeout started: ${timeoutMs}ms`);
    
    // Main timeout handler
    timeoutRef.current = setTimeout(() => {
      console.log('Form submission timeout reached');
      isActiveRef.current = false;
      
      toast({
        title: "Form Timeout",
        description: "Form submission is taking too long. Saving as draft...",
        variant: "destructive"
      });
      
      onTimeout?.();
    }, timeoutMs);
    
    // Progress updates every second
    if (onProgress) {
      progressRef.current = setInterval(() => {
        if (!isActiveRef.current) return;
        
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, timeoutMs - elapsed);
        
        onProgress(remaining);
        
        if (remaining <= 0) {
          clearInterval(progressRef.current!);
          progressRef.current = null;
        }
      }, 1000);
    }
    
    // Auto-save timer
    if (enableAutoSave && autoSaveCallback) {
      autoSaveRef.current = setInterval(() => {
        if (!isActiveRef.current) return;
        
        console.log('Auto-saving form...');
        autoSaveCallback();
      }, autoSaveInterval);
    }
  }, [timeoutMs, onTimeout, onProgress, enableAutoSave, autoSaveInterval, toast, cleanup]);

  const resetTimeout = useCallback(() => {
    if (isActiveRef.current) {
      console.log('Form timeout reset');
      startTimeRef.current = Date.now();
    }
  }, []);

  const stopTimeout = useCallback(() => {
    console.log('Form timeout stopped');
    cleanup();
  }, [cleanup]);

  const getRemainingTime = useCallback(() => {
    if (!isActiveRef.current) return 0;
    const elapsed = Date.now() - startTimeRef.current;
    return Math.max(0, timeoutMs - elapsed);
  }, [timeoutMs]);

  const getTimeoutWarning = useCallback(() => {
    const remaining = getRemainingTime();
    if (remaining <= 10000) return 'critical'; // Less than 10 seconds
    if (remaining <= 20000) return 'warning'; // Less than 20 seconds
    return 'normal';
  }, [getRemainingTime]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    startTimeout,
    stopTimeout,
    resetTimeout,
    getRemainingTime,
    getTimeoutWarning,
    isActive: isActiveRef.current
  };
};