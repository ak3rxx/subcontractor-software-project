import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ErrorInfo {
  id: string;
  type: 'validation' | 'upload' | 'network' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  field?: string;
  message: string;
  details?: string;
  timestamp: Date;
  resolved?: boolean;
  recoveryAttempts: number;
}

interface UseQAErrorTrackingReturn {
  errors: ErrorInfo[];
  addError: (error: Omit<ErrorInfo, 'id' | 'timestamp' | 'recoveryAttempts'>) => string;
  resolveError: (errorId: string) => void;
  clearErrors: () => void;
  retryError: (errorId: string, retryFn: () => Promise<boolean>) => Promise<boolean>;
  getErrorsByType: (type: ErrorInfo['type']) => ErrorInfo[];
  getErrorsBySeverity: (severity: ErrorInfo['severity']) => ErrorInfo[];
  hasUnresolvedErrors: () => boolean;
  getErrorStats: () => {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
}

export const useQAErrorTracking = (): UseQAErrorTrackingReturn => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const { toast } = useToast();

  // Auto-cleanup resolved errors after 5 minutes
  useEffect(() => {
    const cleanup = setInterval(() => {
      setErrors(prev => prev.filter(error => 
        !error.resolved || (Date.now() - error.timestamp.getTime()) < 5 * 60 * 1000
      ));
    }, 60000); // Check every minute

    return () => clearInterval(cleanup);
  }, []);

  const addError = useCallback((errorData: Omit<ErrorInfo, 'id' | 'timestamp' | 'recoveryAttempts'>) => {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newError: ErrorInfo = {
      ...errorData,
      id: errorId,
      timestamp: new Date(),
      recoveryAttempts: 0,
      resolved: false
    };

    setErrors(prev => [...prev, newError]);

    // Show toast for critical/high severity errors
    if (errorData.severity === 'critical' || errorData.severity === 'high') {
      toast({
        title: `${errorData.severity === 'critical' ? 'Critical' : 'High Priority'} Error`,
        description: errorData.message,
        variant: "destructive",
      });
    }

    return errorId;
  }, [toast]);

  const resolveError = useCallback((errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId 
        ? { ...error, resolved: true }
        : error
    ));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const retryError = useCallback(async (errorId: string, retryFn: () => Promise<boolean>) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return false;

    // Update retry attempts
    setErrors(prev => prev.map(e => 
      e.id === errorId 
        ? { ...e, recoveryAttempts: e.recoveryAttempts + 1 }
        : e
    ));

    try {
      const success = await retryFn();
      
      if (success) {
        resolveError(errorId);
        toast({
          title: "Error Resolved",
          description: "The issue has been successfully resolved.",
        });
      } else {
        toast({
          title: "Retry Failed",
          description: "The retry attempt was unsuccessful.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (err) {
      toast({
        title: "Retry Error",
        description: "An error occurred during the retry attempt.",
        variant: "destructive",
      });
      return false;
    }
  }, [errors, resolveError, toast]);

  const getErrorsByType = useCallback((type: ErrorInfo['type']) => {
    return errors.filter(error => error.type === type && !error.resolved);
  }, [errors]);

  const getErrorsBySeverity = useCallback((severity: ErrorInfo['severity']) => {
    return errors.filter(error => error.severity === severity && !error.resolved);
  }, [errors]);

  const hasUnresolvedErrors = useCallback(() => {
    return errors.some(error => !error.resolved);
  }, [errors]);

  const getErrorStats = useCallback(() => {
    const unresolvedErrors = errors.filter(error => !error.resolved);
    
    const byType = unresolvedErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = unresolvedErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: unresolvedErrors.length,
      byType,
      bySeverity
    };
  }, [errors]);

  return {
    errors: errors.filter(error => !error.resolved),
    addError,
    resolveError,
    clearErrors,
    retryError,
    getErrorsByType,
    getErrorsBySeverity,
    hasUnresolvedErrors,
    getErrorStats
  };
};