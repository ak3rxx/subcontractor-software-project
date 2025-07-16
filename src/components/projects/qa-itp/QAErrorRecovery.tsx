import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, FileText, MessageSquare, CheckCircle, X, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ErrorInfo {
  id: string;
  type: 'validation' | 'upload' | 'network' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';
  field?: string;
  message: string;
  details?: string;
  recoveryActions?: RecoveryAction[];
  learnedFrom?: string[];
}

interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  type: 'auto' | 'manual' | 'escalate';
  handler: () => Promise<boolean>;
  icon?: React.ReactNode;
}

interface QAErrorRecoveryProps {
  errors: ErrorInfo[];
  onErrorResolved?: (errorId: string) => void;
  onRetry?: (context: any) => Promise<boolean>;
  onEscalate?: (errorId: string, details: string) => void;
}

const QAErrorRecovery: React.FC<QAErrorRecoveryProps> = ({
  errors,
  onErrorResolved,
  onRetry,
  onEscalate
}) => {
  const [retryingErrors, setRetryingErrors] = useState<Set<string>>(new Set());
  const [escalationDetails, setEscalationDetails] = useState<Record<string, string>>({});
  const [showEscalation, setShowEscalation] = useState<string | null>(null);
  const { toast } = useToast();

  const getErrorIcon = (type: ErrorInfo['type']) => {
    switch (type) {
      case 'validation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'upload':
        return <FileText className="h-4 w-4" />;
      case 'network':
        return <RefreshCw className="h-4 w-4" />;
      case 'system':
        return <Zap className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: ErrorInfo['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDefaultRecoveryActions = (error: ErrorInfo): RecoveryAction[] => {
    const actions: RecoveryAction[] = [];

    // Auto-retry for network/upload errors
    if (error.type === 'network' || error.type === 'upload') {
      actions.push({
        id: 'auto_retry',
        label: 'Retry Automatically',
        description: 'Attempt to retry the failed operation',
        type: 'auto',
        icon: <RefreshCw className="h-4 w-4" />,
        handler: async () => {
          if (onRetry) {
            return await onRetry({ errorId: error.id, field: error.field });
          }
          return false;
        }
      });
    }

    // Manual fix for validation errors
    if (error.type === 'validation') {
      actions.push({
        id: 'manual_fix',
        label: 'Review and Fix',
        description: 'Manually review and correct the validation issue',
        type: 'manual',
        icon: <CheckCircle className="h-4 w-4" />,
        handler: async () => {
          // Scroll to field if available
          if (error.field) {
            const element = document.querySelector(`[name="${error.field}"]`);
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (element as HTMLElement)?.focus();
          }
          return true;
        }
      });
    }

    // Escalation for critical/system errors
    if (error.severity === 'critical' || error.type === 'system') {
      actions.push({
        id: 'escalate',
        label: 'Escalate Issue',
        description: 'Report this issue for technical assistance',
        type: 'escalate',
        icon: <MessageSquare className="h-4 w-4" />,
        handler: async () => {
          setShowEscalation(error.id);
          return true;
        }
      });
    }

    return actions;
  };

  const handleRetry = async (error: ErrorInfo, action: RecoveryAction) => {
    setRetryingErrors(prev => new Set(prev).add(error.id));
    
    try {
      const success = await action.handler();
      
      if (success) {
        toast({
          title: "Recovery Successful",
          description: `${action.label} completed successfully.`,
        });
        onErrorResolved?.(error.id);
      } else {
        toast({
          title: "Recovery Failed",
          description: `${action.label} did not resolve the issue.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Recovery Error",
        description: "An error occurred during recovery attempt.",
        variant: "destructive",
      });
    } finally {
      setRetryingErrors(prev => {
        const newSet = new Set(prev);
        newSet.delete(error.id);
        return newSet;
      });
    }
  };

  const handleEscalation = (errorId: string) => {
    const details = escalationDetails[errorId] || '';
    onEscalate?.(errorId, details);
    setShowEscalation(null);
    setEscalationDetails(prev => ({ ...prev, [errorId]: '' }));
    
    toast({
      title: "Issue Escalated",
      description: "Your issue has been reported for technical assistance.",
    });
  };

  if (errors.length === 0) {
    return (
      <Alert className="border-success">
        <CheckCircle className="h-4 w-4 text-success" />
        <AlertDescription className="text-success">
          All systems operating normally. No errors detected.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Error Recovery Center ({errors.length} issues)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.map((error) => {
            const recoveryActions = error.recoveryActions || getDefaultRecoveryActions(error);
            const isRetrying = retryingErrors.has(error.id);

            return (
              <div key={error.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-destructive mt-0.5">
                      {getErrorIcon(error.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{error.message}</h4>
                        <Badge variant={getSeverityColor(error.severity)} className="text-xs">
                          {error.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {error.type}
                        </Badge>
                      </div>
                      {error.details && (
                        <p className="text-xs text-muted-foreground">{error.details}</p>
                      )}
                      {error.field && (
                        <p className="text-xs text-muted-foreground">Field: {error.field}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recovery Actions */}
                <div className="flex flex-wrap gap-2">
                  {recoveryActions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.type === 'escalate' ? 'destructive' : 'outline'}
                      size="sm"
                      disabled={isRetrying}
                      onClick={() => handleRetry(error, action)}
                      className="text-xs"
                    >
                      {isRetrying && action.type === 'auto' ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        action.icon && <span className="mr-1">{action.icon}</span>
                      )}
                      {action.label}
                    </Button>
                  ))}
                </div>

                {/* Escalation Form */}
                {showEscalation === error.id && (
                  <div className="border-t pt-3 space-y-3">
                    <h4 className="font-medium text-sm">Escalation Details</h4>
                    <Textarea
                      placeholder="Please describe what you were doing when this error occurred and any additional context..."
                      value={escalationDetails[error.id] || ''}
                      onChange={(e) => 
                        setEscalationDetails(prev => ({ ...prev, [error.id]: e.target.value }))
                      }
                      className="min-h-[80px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEscalation(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleEscalation(error.id)}
                      >
                        Submit Report
                      </Button>
                    </div>
                  </div>
                )}

                {/* Learning Indicators */}
                {error.learnedFrom && error.learnedFrom.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Similar issues resolved: {error.learnedFrom.join(', ')}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default QAErrorRecovery;