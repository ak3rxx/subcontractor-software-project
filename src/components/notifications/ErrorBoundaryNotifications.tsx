import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

export class ErrorBoundaryNotifications extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;

  public state: State = {
    hasError: false,
    errorCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorCount: 0
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Notification system error:', error, errorInfo);
    
    // Report to parent component
    this.props.onError?.(error, errorInfo);
    
    // Show user-friendly notification
    toast.error('Notification system temporarily unavailable', {
      description: 'Attempting to recover automatically...',
      duration: 5000
    });

    // Increment error count
    this.setState(prev => ({ 
      ...prev, 
      errorCount: prev.errorCount + 1 
    }));

    // Auto-recovery after 3 seconds (max 3 attempts)
    if (this.state.errorCount < 3) {
      this.retryTimeout = setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 3000);
    }
  }

  public componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Silent failure for notifications - don't block the UI
      if (this.state.errorCount >= 3) {
        console.warn('Notification system disabled after 3 failed attempts');
        return null;
      }

      return (
        <div className="hidden">
          {/* Recovery in progress - render nothing to user */}
        </div>
      );
    }

    return this.props.children;
  }
}