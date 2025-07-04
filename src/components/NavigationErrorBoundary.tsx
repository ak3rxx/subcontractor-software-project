import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class NavigationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert className="border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="mt-2">
                <div className="space-y-3">
                  <p>Navigation error occurred. Please try refreshing the page.</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={this.handleRetry}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Retry
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reload Page
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NavigationErrorBoundary;