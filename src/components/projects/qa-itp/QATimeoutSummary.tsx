import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, WifiOff } from 'lucide-react';

interface QATimeoutSummaryProps {
  className?: string;
}

const QATimeoutSummary: React.FC<QATimeoutSummaryProps> = ({ className }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>QA/ITP Form Timeout Issues Fixed</strong>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>45-second timeout with auto-draft saving</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              <span>Real-time progress tracking and warnings</span>
            </div>
            <div className="flex items-center gap-2">
              <WifiOff className="h-3 w-3" />
              <span>Enhanced error handling and retry logic</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>What's been improved:</strong></p>
        <ul className="list-disc list-inside space-y-0.5 ml-2">
          <li>Database function optimized with 15s timeout</li>
          <li>Form submission timeout handling (45s max)</li>
          <li>Automatic draft saving on timeout</li>
          <li>Real-time progress indicator during submission</li>
          <li>Enhanced file upload with retry logic</li>
          <li>Better error messages and user feedback</li>
        </ul>
      </div>
    </div>
  );
};

export default QATimeoutSummary;